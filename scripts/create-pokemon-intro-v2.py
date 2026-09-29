from __future__ import annotations

import math
import random
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageSequence


ROOT = Path(__file__).resolve().parents[1]
SPRITE_DIR = ROOT / "assets" / "pokemon" / "showdown" / "gen5" / "front"
ANIMATION_DIR = ROOT / "assets" / "animations"
IMAGE_DIR = ROOT / "assets" / "images"

LOGICAL_SIZE = (360, 640)
OUTPUT_SIZE = (720, 1280)
FPS = 20
FRAME_COUNT = 120


@dataclass(frozen=True)
class Runner:
    pokemon_id: int
    x: int
    ground_y: int
    target_height: int
    phase: float
    lean: float


class AnimatedSprite:
    def __init__(self, pokemon_id: int):
        source = Image.open(SPRITE_DIR / f"{pokemon_id}.gif")
        self.frames = [frame.convert("RGBA") for frame in ImageSequence.Iterator(source)]

    def frame(self, frame_index: int) -> Image.Image:
        return self.frames[frame_index % len(self.frames)]


def clamp(value: float, low: float = 0, high: float = 1) -> float:
    return max(low, min(high, value))


def ease(value: float) -> float:
    value = clamp(value)
    return value * value * (3 - 2 * value)


def alpha_crop(image: Image.Image) -> Image.Image:
    box = image.getchannel("A").getbbox()
    return image.crop(box) if box else image


def rig_running_sprite(sprite: Image.Image, cycle: float, lean: float) -> Image.Image:
    """Apply a small two-part pixel rig so sprites compress, lean and plant their feet."""
    sprite = alpha_crop(sprite)
    width, height = sprite.size
    split_y = max(1, round(height * 0.68))
    half_x = width // 2
    stride = round(math.sin(cycle * math.tau) * max(1, width * 0.055))
    lift_left = round(max(0, math.sin(cycle * math.tau)) * max(1, height * 0.06))
    lift_right = round(max(0, -math.sin(cycle * math.tau)) * max(1, height * 0.06))
    compression = 0.94 + 0.06 * abs(math.cos(cycle * math.tau))

    padded = Image.new("RGBA", (width + 18, height + 18), (0, 0, 0, 0))
    upper = sprite.crop((0, 0, width, split_y))
    lower_left = sprite.crop((0, split_y, half_x, height))
    lower_right = sprite.crop((half_x, split_y, width, height))

    upper_height = max(1, round(upper.height * compression))
    upper = upper.resize((upper.width, upper_height), Image.Resampling.NEAREST)
    padded.alpha_composite(upper, (9 + round(lean / 3), 8 + split_y - upper.height))
    feet_y = 8 + height - (height - split_y)
    padded.alpha_composite(lower_left, (9 + stride, feet_y - lift_left))
    padded.alpha_composite(lower_right, (9 + half_x - stride, feet_y - lift_right))
    return alpha_crop(padded)


def rig_flying_sprite(sprite: Image.Image, cycle: float, lean: float) -> Image.Image:
    sprite = alpha_crop(sprite)
    stretch = 0.96 + 0.08 * (0.5 + 0.5 * math.sin(cycle * math.tau))
    sprite = sprite.resize(
        (max(1, round(sprite.width * (2 - stretch))), max(1, round(sprite.height * stretch))),
        Image.Resampling.NEAREST,
    )
    return sprite.rotate(lean, resample=Image.Resampling.NEAREST, expand=True)


def resize_to_height(sprite: Image.Image, target_height: float) -> Image.Image:
    scale = target_height / sprite.height
    return sprite.resize(
        (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale))),
        Image.Resampling.NEAREST,
    )


def paste_center_bottom(canvas: Image.Image, sprite: Image.Image, x: float, bottom: float) -> None:
    canvas.alpha_composite(sprite, (round(x - sprite.width / 2), round(bottom - sprite.height)))


def draw_shadow(frame: Image.Image, x: float, y: float, width: float, alpha: int = 58) -> None:
    draw = ImageDraw.Draw(frame, "RGBA")
    draw.ellipse(
        (round(x - width / 2), round(y - width * 0.12), round(x + width / 2), round(y + width * 0.12)),
        fill=(65, 75, 55, alpha),
    )


def draw_soft_dust(
    frame: Image.Image,
    x: float,
    ground_y: float,
    age: float,
    size: float,
    seed: int,
) -> None:
    age = clamp(age)
    rng = random.Random(seed)
    draw = ImageDraw.Draw(frame, "RGBA")
    palette = ((201, 180, 142), (220, 202, 166), (236, 221, 189))
    for index in range(7):
        drift = age * size * (0.65 + rng.random() * 0.65)
        px = x + rng.uniform(-size * 0.35, size * 0.25) + drift
        py = ground_y - rng.uniform(1, size * 0.22) - age * rng.uniform(size * 0.05, size * 0.35)
        radius = max(1, (0.16 + age * 0.34) * size * rng.uniform(0.45, 0.9))
        alpha = round(125 * (1 - age) ** 1.7)
        color = (*palette[index % len(palette)], alpha)
        draw.ellipse((px - radius, py - radius * 0.65, px + radius, py + radius * 0.65), fill=color)


def draw_background(frame: Image.Image, scroll: float, shake_y: int = 0) -> None:
    draw = ImageDraw.Draw(frame)
    draw.rectangle((0, 0, 359, 639), fill="#eef8fb")

    # Distant hills and treeline establish depth without a hard horizontal split.
    far_shift = int(scroll * 0.12) % 180
    hill = [(x - far_shift, 370 + int(12 * math.sin((x - far_shift) / 48))) for x in range(-180, 721, 12)]
    draw.polygon([(hill[0][0], 640), *hill, (hill[-1][0], 640)], fill="#cfe5ba")

    tree_shift = int(scroll * 0.28) % 110
    for x in range(-110 - tree_shift, 470, 110):
        draw.ellipse((x, 350 + shake_y, x + 68, 430 + shake_y), fill="#a8ce91")
        draw.rectangle((x + 30, 410 + shake_y, x + 37, 470 + shake_y), fill="#9a8562")

    ground_edge = [(0, 452 + shake_y), (58, 446 + shake_y), (125, 454 + shake_y), (192, 443 + shake_y), (270, 451 + shake_y), (360, 445 + shake_y)]
    draw.polygon([*ground_edge, (360, 640), (0, 640)], fill="#b9dc93")

    # Uneven dirt trail with pixel clusters and grass intrusion.
    path_edge = [(0, 510 + shake_y), (56, 498 + shake_y), (118, 506 + shake_y), (184, 493 + shake_y), (252, 503 + shake_y), (310, 495 + shake_y), (360, 501 + shake_y)]
    draw.polygon([*path_edge, (360, 640), (0, 640)], fill="#dbc89f")
    detail_shift = int(scroll * 0.75) % 96
    for x in range(-96 - detail_shift, 456, 48):
        draw.ellipse((x, 558 + (x % 3) * 7, x + 10, 562 + (x % 3) * 7), fill="#c2aa7f")
        draw.line((x + 25, 493, x + 25, 504), fill="#7fa962", width=2)
        draw.line((x + 21, 499, x + 29, 496), fill="#7fa962", width=2)


GROUND_RUNNERS = (
    Runner(143, 92, 494, 92, 0.05, -4),
    Runner(448, 158, 500, 72, 0.55, -8),
    Runner(133, 31, 521, 53, 0.18, -8),
    Runner(1, 73, 532, 50, 0.67, -7),
    Runner(4, 111, 520, 54, 0.38, -10),
    Runner(54, 150, 535, 56, 0.82, -7),
    Runner(501, 193, 529, 55, 0.14, -8),
    Runner(172, 58, 560, 44, 0.76, -11),
    Runner(175, 98, 569, 39, 0.29, -8),
    Runner(7, 138, 561, 47, 0.91, -8),
    Runner(39, 178, 563, 48, 0.48, -7),
    Runner(572, 218, 557, 49, 0.02, -9),
)


def render_side_pack(
    frame: Image.Image,
    sprites: dict[int, AnimatedSprite],
    frame_index: int,
    base_x: float,
    crowd_alpha: float = 1,
) -> None:
    layer = Image.new("RGBA", LOGICAL_SIZE, (0, 0, 0, 0))

    # Airborne pursuers follow distinct arcs but remain part of the pack silhouette.
    charizard_cycle = (frame_index / 18) % 1
    charizard_y = 386 + math.sin(frame_index * 0.24) * 9
    charizard = rig_flying_sprite(sprites[6].frame(frame_index * 2), charizard_cycle, -7)
    charizard = resize_to_height(charizard, 102)
    paste_center_bottom(layer, charizard, base_x + 108, charizard_y)

    gengar_cycle = (frame_index / 22 + 0.35) % 1
    gengar_y = 425 + math.sin(frame_index * 0.19 + 1.5) * 13
    gengar = rig_flying_sprite(sprites[94].frame(frame_index * 2 + 11), gengar_cycle, -5)
    gengar = resize_to_height(gengar, 65)
    paste_center_bottom(layer, gengar, base_x + 207, gengar_y)

    # Back-to-front ground ordering creates deliberate body overlap.
    for order, runner in enumerate(GROUND_RUNNERS):
        cycle = (frame_index / 10 + runner.phase) % 1
        bob = abs(math.sin(cycle * math.tau)) * (4 if runner.target_height < 60 else 6)
        x = base_x + runner.x + math.sin(frame_index * 0.11 + order) * 2
        y = runner.ground_y - bob
        sprite = rig_running_sprite(sprites[runner.pokemon_id].frame(frame_index * 2 + order * 3), cycle, runner.lean)
        sprite = resize_to_height(sprite, runner.target_height)
        draw_shadow(layer, x, runner.ground_y + 2, sprite.width * 0.62, 48)
        paste_center_bottom(layer, sprite, x, y)

        # A small puff occurs only near each foot-contact phase.
        contact = abs(math.sin(cycle * math.tau))
        if contact < 0.22 and order % 3 == 0:
            draw_soft_dust(layer, x + sprite.width * 0.24, runner.ground_y, contact / 0.22, 8, frame_index + order * 101)

    # One broad rear cloud ties the runners together without obscuring their feet.
    pack_cycle = (frame_index % 12) / 12
    draw_soft_dust(layer, base_x + 232, 566, pack_cycle, 18, frame_index // 12 + 900)

    if crowd_alpha < 1:
        layer.putalpha(ImageEnhance.Brightness(layer.getchannel("A")).enhance(crowd_alpha))
    frame.alpha_composite(layer)


def whole_hero_sprite(
    sprite: Image.Image,
    target_height: float,
    angle: float = 0,
) -> Image.Image:
    """Scale and rotate an intact sprite so tiny pixel parts never separate."""
    sprite = resize_to_height(alpha_crop(sprite), target_height)
    if angle:
        sprite = sprite.rotate(angle, resample=Image.Resampling.NEAREST, expand=True)
    return sprite


def build_hero(sprites: dict[int, AnimatedSprite], frame_index: int = 0) -> Image.Image:
    hero = Image.new("RGBA", (360, 470), (0, 0, 0, 0))
    tick = frame_index * 0.22

    # Upper airborne silhouette.
    charizard_bob = math.sin(tick) * 5
    charizard = whole_hero_sprite(
        sprites[6].frame(23 + frame_index * 2),
        128,
        2 + math.sin(tick * 0.8) * 2,
    )
    paste_center_bottom(hero, charizard, 105, 188 + charizard_bob)
    gengar_bob = math.sin(tick * 0.83 + 1.4) * 7
    gengar = whole_hero_sprite(
        sprites[94].frame(31 + frame_index * 2),
        78,
        math.sin(tick * 0.75 + 0.4) * 3,
    )
    paste_center_bottom(hero, gengar, 278, 198 + gengar_bob)

    # Large rear characters.
    snorlax_bob = abs(math.sin(tick * 0.7)) * 2
    snorlax = whole_hero_sprite(sprites[143].frame(37 + frame_index), 119)
    draw_shadow(hero, 190, 329, 75, 52)
    paste_center_bottom(hero, snorlax, 190, 329 - snorlax_bob)
    lucario_motion = math.sin(tick * 1.25 + 0.8)
    lucario = whole_hero_sprite(
        sprites[448].frame(28 + frame_index * 2),
        88,
        lucario_motion * 2,
    )
    draw_shadow(hero, 269, 340, 45, 48)
    paste_center_bottom(hero, lucario, 269, 340 - abs(lucario_motion) * 3)

    placements = (
        (133, 72, 342, 61, 0.15),
        (1, 117, 361, 59, 0.68),
        (4, 160, 347, 64, 0.39),
        (54, 221, 359, 65, 0.81),
        (501, 276, 370, 61, 0.22),
        (172, 87, 404, 48, 0.74),
        (175, 132, 422, 44, 0.31),
        (7, 178, 413, 55, 0.92),
        (39, 229, 411, 56, 0.48),
        (572, 282, 405, 58, 0.03),
    )
    for order, (pokemon_id, x, y, height, phase) in enumerate(placements):
        motion = math.sin(tick * (0.9 + order * 0.025) + phase * math.tau)
        sprite = whole_hero_sprite(
            sprites[pokemon_id].frame(20 + order * 4 + frame_index * 2),
            height,
            motion * 1.5,
        )
        draw_shadow(hero, x, y + 2, sprite.width * 0.62, 43)
        paste_center_bottom(hero, sprite, x, y - abs(motion) * 2.5)

    # Pikachu is the focal point and sits in front of the overlapping group.
    pikachu_motion = math.sin(tick * 1.2 + 0.5)
    pikachu = whole_hero_sprite(
        sprites[25].frame(24 + frame_index * 2),
        77,
        pikachu_motion * 2,
    )
    draw_shadow(hero, 180, 452, 53, 58)
    paste_center_bottom(hero, pikachu, 180, 452 - abs(pikachu_motion) * 4)
    draw_soft_dust(hero, 118, 442, 0.35, 18, 311)
    draw_soft_dust(hero, 246, 440, 0.55, 17, 517)
    return hero


def render_frames() -> tuple[list[Image.Image], Image.Image]:
    ids = {25, 6, 94, 448, 143, 133, 1, 4, 7, 54, 501, 172, 175, 39, 572}
    sprites = {pokemon_id: AnimatedSprite(pokemon_id) for pokemon_id in ids}
    hero = build_hero(sprites, 0)
    frames: list[Image.Image] = []

    for frame_index in range(FRAME_COUNT):
        time = frame_index / FPS
        chase_active = 2.7 <= time < 4.8
        scroll = max(0, time - 2.35) * 105 if chase_active else 0
        rumble = int(math.sin(frame_index * 2.4) * 2) if 2.0 <= time < 4.7 else 0
        frame = Image.new("RGBA", LOGICAL_SIZE, "white")
        draw_background(frame, scroll, rumble)

        # Pikachu enters and settles at center.
        if time < 1.05:
            progress = ease(time / 1.05)
            x = 408 + (180 - 408) * progress
            cycle = (frame_index / 9) % 1
            # Keep Pikachu whole during the solo entrance. Splitting the tiny sprite
            # into rig sections can open one-pixel seams while it moves quickly.
            sprite = alpha_crop(sprites[25].frame(frame_index * 2))
            stretch = 0.97 + 0.03 * abs(math.sin(cycle * math.tau))
            target_height = 92 * stretch
            sprite = resize_to_height(sprite, target_height)
            sprite = sprite.rotate(
                -7 + math.sin(cycle * math.tau) * 3,
                resample=Image.Resampling.NEAREST,
                expand=True,
            )
            y = 520 - abs(math.sin(cycle * math.tau)) * 7
            draw_shadow(frame, x, 522, 52, 54)
            paste_center_bottom(frame, sprite, x, y)
            if frame_index % 9 < 3:
                draw_soft_dust(frame, x + 35, 522, (frame_index % 9) / 3, 10, frame_index // 9 + 30)
        elif time < 2.05:
            local = time - 1.05
            wave = math.sin(local * math.pi * 5)
            sprite = alpha_crop(sprites[25].frame(frame_index * 2))
            sprite = resize_to_height(sprite, 94 + abs(wave) * 3)
            sprite = sprite.rotate(wave * 4, resample=Image.Resampling.NEAREST, expand=True)
            draw_shadow(frame, 180, 522, 50, 48)
            paste_center_bottom(frame, sprite, 180, 517 - abs(wave) * 3)
        elif time < 2.48:
            local = (time - 2.05) / 0.43
            jump = math.sin(clamp(local) * math.pi) * 24
            sprite = alpha_crop(sprites[25].frame(frame_index * 3))
            sprite = resize_to_height(sprite, 96 + 7 * math.sin(clamp(local) * math.pi))
            draw_shadow(frame, 180, 522, 48 - jump * 0.7, 45)
            paste_center_bottom(frame, sprite, 180, 517 - jump)
            draw = ImageDraw.Draw(frame)
            draw.rounded_rectangle((228, 385, 238, 416), radius=3, fill="#45321f")
            draw.rectangle((231, 389, 235, 406), fill="#ffe04c")
            draw.ellipse((229, 421, 238, 430), fill="#45321f")
            draw.rectangle((232, 423, 235, 427), fill="#ffe04c")
        elif time < 3.28:
            progress = ease((time - 2.48) / 0.8)
            x = 180 + (-95 - 180) * progress
            cycle = (frame_index / 7) % 1
            sprite = resize_to_height(rig_running_sprite(sprites[25].frame(frame_index * 3), cycle, -13), 91)
            y = 520 - abs(math.sin(cycle * math.tau)) * 8
            draw_shadow(frame, x, 522, 50, 50)
            paste_center_bottom(frame, sprite, x, y)
            if frame_index % 7 < 3:
                draw_soft_dust(frame, x + 38, 522, (frame_index % 7) / 3, 12, frame_index // 7 + 70)

        # Dense chase pack, with flyers on their own trajectories.
        if chase_active:
            progress = ease((time - 2.7) / 2.1)
            base_x = 376 + (-350 - 376) * progress
            render_side_pack(frame, sprites, frame_index, base_x)

        # Dust bridges side-view chase into a front-facing hero charge.
        if 4.25 <= time < 5.05:
            transition = ease((time - 4.25) / 0.8)
            veil = Image.new("RGBA", LOGICAL_SIZE, (0, 0, 0, 0))
            for dust_index in range(12):
                angle = dust_index / 12 * math.tau
                radius = 28 + transition * 150
                x = 180 + math.cos(angle) * radius * 0.72
                y = 500 + math.sin(angle) * radius * 0.34
                draw_soft_dust(veil, x, y, 0.15 + transition * 0.55, 30 + transition * 30, 1500 + dust_index)
            frame.alpha_composite(veil)

        if 4.65 <= time < 5.55:
            charge = ease((time - 4.65) / 0.9)
            target_height = 275 + charge * 205
            scale = target_height / hero.height
            hero_frame = hero.resize(
                (round(hero.width * scale), round(hero.height * scale)),
                Image.Resampling.NEAREST,
            )
            hero_x = round(180 - hero_frame.width / 2)
            hero_y = round(625 - hero_frame.height)
            frame.alpha_composite(hero_frame, (hero_x, hero_y))

        if time >= 5.28:
            white = ease((time - 5.28) / 0.5)
            frame.alpha_composite(Image.new("RGBA", LOGICAL_SIZE, (255, 255, 255, round(255 * white))))

        frames.append(frame.convert("RGB").resize(OUTPUT_SIZE, Image.Resampling.NEAREST))

    return frames, hero


def save_gif(frames: list[Image.Image], path: Path) -> None:
    previews = [frame.resize(LOGICAL_SIZE, Image.Resampling.NEAREST) for frame in frames]
    previews[0].save(
        path,
        save_all=True,
        append_images=previews[1:],
        duration=round(1000 / FPS),
        loop=0,
        optimize=True,
        disposal=2,
    )


def save_storyboard(frames: list[Image.Image], path: Path) -> None:
    indexes = (0, 14, 28, 41, 49, 58, 69, 82, 95, 106, 112, 119)
    thumb_size = (180, 320)
    board = Image.new("RGB", (thumb_size[0] * 6, thumb_size[1] * 2), "white")
    for position, frame_index in enumerate(indexes):
        board.paste(
            frames[frame_index].resize(thumb_size, Image.Resampling.NEAREST),
            ((position % 6) * thumb_size[0], (position // 6) * thumb_size[1]),
        )
    board.save(path)


def render_hero_animation() -> list[Image.Image]:
    ids = {25, 6, 94, 448, 143, 133, 1, 4, 7, 54, 501, 172, 175, 39, 572}
    sprites = {pokemon_id: AnimatedSprite(pokemon_id) for pokemon_id in ids}
    return [build_hero(sprites, frame_index) for frame_index in range(48)]


def save_hero_animation(frames: list[Image.Image], png_path: Path, gif_path: Path) -> None:
    scaled = [frame.resize((720, 940), Image.Resampling.NEAREST) for frame in frames]
    scaled[0].save(png_path)
    scaled[0].save(
        gif_path,
        save_all=True,
        append_images=scaled[1:],
        duration=120,
        loop=0,
        optimize=True,
        disposal=2,
    )


def save_mp4(frames: list[Image.Image], path: Path) -> bool:
    try:
        import imageio_ffmpeg
    except ImportError:
        return False
    command = [
        imageio_ffmpeg.get_ffmpeg_exe(), "-y",
        "-f", "rawvideo", "-vcodec", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{OUTPUT_SIZE[0]}x{OUTPUT_SIZE[1]}", "-r", str(FPS), "-i", "-",
        "-an", "-vcodec", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(path),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert process.stdin is not None
    for frame in frames:
        process.stdin.write(np.asarray(frame, dtype=np.uint8).tobytes())
    process.stdin.close()
    return process.wait() == 0


def main() -> int:
    ANIMATION_DIR.mkdir(parents=True, exist_ok=True)
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    frames, hero = render_frames()

    preview_path = ANIMATION_DIR / "pokemon-intro-v2-preview.gif"
    video_path = ANIMATION_DIR / "pokemon-intro-v2.mp4"
    storyboard_path = ANIMATION_DIR / "pokemon-intro-v2-storyboard.png"
    hero_path = IMAGE_DIR / "pokemon-main-hero-v2.png"
    hero_gif_path = IMAGE_DIR / "pokemon-main-hero-v2.gif"

    save_gif(frames, preview_path)
    save_storyboard(frames, storyboard_path)
    hero_frames = render_hero_animation()
    save_hero_animation(hero_frames, hero_path, hero_gif_path)
    mp4_written = save_mp4(frames, video_path)

    print(f"Preview: {preview_path}")
    print(f"Storyboard: {storyboard_path}")
    print(f"Hero: {hero_path}")
    print(f"Animated hero: {hero_gif_path}")
    print(f"MP4: {video_path if mp4_written else 'skipped (imageio-ffmpeg unavailable)'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
