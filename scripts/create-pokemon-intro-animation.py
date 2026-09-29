from __future__ import annotations

import math
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageSequence


ROOT = Path(__file__).resolve().parents[1]
SPRITE_DIR = ROOT / "assets" / "pokemon" / "showdown" / "gen5" / "front"
OUTPUT_DIR = ROOT / "assets" / "animations"

LOGICAL_SIZE = (360, 640)
OUTPUT_SIZE = (720, 1280)
FPS = 20
FRAME_COUNT = 100


@dataclass(frozen=True)
class CrowdMember:
    pokemon_id: int
    x: int
    y: int
    scale: float
    phase: int
    lean: float = -5


class AnimatedSprite:
    def __init__(self, path: Path):
        image = Image.open(path)
        self.frames = [frame.convert("RGBA") for frame in ImageSequence.Iterator(image)]
        if not self.frames:
            raise ValueError(f"No frames found in {path}")

    def frame(self, index: int) -> Image.Image:
        return self.frames[index % len(self.frames)]


def ease_in_out(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return value * value * (3 - 2 * value)


def paste_sprite(
    canvas: Image.Image,
    sprite: Image.Image,
    center_x: float,
    bottom_y: float,
    scale: float,
    angle: float = 0,
    squash: float = 1,
) -> None:
    width = max(1, round(sprite.width * scale))
    height = max(1, round(sprite.height * scale * squash))
    sprite = sprite.resize((width, height), Image.Resampling.NEAREST)
    if angle:
        sprite = sprite.rotate(angle, resample=Image.Resampling.NEAREST, expand=True)
    x = round(center_x - sprite.width / 2)
    y = round(bottom_y - sprite.height)
    canvas.alpha_composite(sprite, (x, y))


def draw_background(frame: Image.Image) -> None:
    draw = ImageDraw.Draw(frame)
    draw.rectangle((0, 0, 359, 505), fill="#eef9ff")
    draw.rectangle((0, 506, 359, 639), fill="#e8f4cf")
    draw.rectangle((0, 506, 359, 510), fill="#b9d998")

    # Small DS-style block clouds and grass tufts.
    draw.rectangle((34, 92, 94, 105), fill="#ffffff")
    draw.rectangle((50, 82, 78, 112), fill="#ffffff")
    draw.rectangle((252, 142, 326, 154), fill="#ffffff")
    draw.rectangle((274, 130, 307, 160), fill="#ffffff")
    for x in (18, 48, 116, 154, 287, 331):
        draw.rectangle((x, 530, x + 3, 542), fill="#95bd73")
        draw.rectangle((x - 4, 535, x + 7, 538), fill="#95bd73")


def draw_dust(draw: ImageDraw.ImageDraw, x: float, y: float, age: float) -> None:
    color = (224, 211, 180, max(0, round(220 * (1 - age))))
    radius = round(3 + age * 8)
    px = round(x - age * 18)
    py = round(y - age * 8)
    draw.rectangle((px - radius, py - radius, px + radius, py + radius), fill=color)


def draw_exclamation(frame: Image.Image, x: int, y: int, pulse: int) -> None:
    draw = ImageDraw.Draw(frame)
    offset = -2 if pulse % 2 else 0
    dark = "#3a2418"
    yellow = "#ffd93d"
    draw.rectangle((x - 5, y - 19 + offset, x + 5, y + 4 + offset), fill=dark)
    draw.rectangle((x - 2, y - 16 + offset, x + 2, y - 1 + offset), fill=yellow)
    draw.rectangle((x - 5, y + 9 + offset, x + 5, y + 19 + offset), fill=dark)
    draw.rectangle((x - 2, y + 12 + offset, x + 2, y + 16 + offset), fill=yellow)


def render_frames() -> list[Image.Image]:
    pikachu = AnimatedSprite(SPRITE_DIR / "25.gif")
    crowd = [
        CrowdMember(6, 95, 420, 1.00, 2, -7),    # Charizard
        CrowdMember(143, 205, 430, 1.00, 11, -4), # Snorlax
        CrowdMember(94, 300, 448, 1.20, 7, -6),   # Gengar
        CrowdMember(448, 255, 465, 1.10, 13, -8), # Lucario
        CrowdMember(133, 20, 480, 1.35, 1, -6),   # Eevee
        CrowdMember(1, 78, 500, 1.35, 4, -5),     # Bulbasaur
        CrowdMember(4, 138, 478, 1.35, 9, -8),    # Charmander
        CrowdMember(7, 190, 510, 1.35, 6, -6),    # Squirtle
        CrowdMember(54, 244, 492, 1.25, 12, -5),  # Psyduck
        CrowdMember(501, 304, 510, 1.30, 3, -7),  # Oshawott
        CrowdMember(172, 58, 548, 1.50, 8, -9),   # Pichu
        CrowdMember(175, 137, 562, 1.45, 15, -6), # Togepi
        CrowdMember(39, 222, 548, 1.35, 5, -6),   # Jigglypuff
        CrowdMember(572, 288, 558, 1.35, 10, -8), # Minccino
    ]
    sprites = {member.pokemon_id: AnimatedSprite(SPRITE_DIR / f"{member.pokemon_id}.gif") for member in crowd}
    frames: list[Image.Image] = []

    for index in range(FRAME_COUNT):
        time = index / FPS
        frame = Image.new("RGBA", LOGICAL_SIZE, "white")
        draw_background(frame)
        draw = ImageDraw.Draw(frame, "RGBA")

        # Pikachu enters, greets, reacts, then bolts left.
        if time < 1.0:
            progress = ease_in_out(time / 1.0)
            x = 410 + (180 - 410) * progress
            y = 486 - abs(math.sin(time * math.pi * 4)) * 14
            angle = -7 + math.sin(time * math.pi * 4) * 5
            paste_sprite(frame, pikachu.frame(index * 2), x, y, 2.35, angle)
        elif time < 2.1:
            local = time - 1.0
            x = 180
            y = 486 - abs(math.sin(local * math.pi * 3)) * 4
            angle = math.sin(local * math.pi * 5) * 5
            squash = 0.98 + 0.04 * abs(math.sin(local * math.pi * 3))
            paste_sprite(frame, pikachu.frame(index * 2), x, y, 2.4, angle, squash)
            if int(local * 8) % 2 == 0:
                draw.rectangle((228, 384, 232, 392), fill="#fff5a5")
                draw.rectangle((224, 388, 236, 392), fill="#fff5a5")
        elif time < 2.55:
            local = time - 2.1
            jump = math.sin(min(1, local / 0.45) * math.pi) * 25
            scale = 2.4 + 0.25 * math.sin(min(1, local / 0.45) * math.pi)
            paste_sprite(frame, pikachu.frame(index * 3), 180, 486 - jump, scale, 4)
            draw_exclamation(frame, 235, 350, index)
        elif time < 3.2:
            progress = ease_in_out((time - 2.55) / 0.65)
            x = 180 + (-90 - 180) * progress
            y = 486 - abs(math.sin((time - 2.55) * math.pi * 8)) * 10
            paste_sprite(frame, pikachu.frame(index * 3), x, y, 2.35, -11)
            for dust_index in range(3):
                age = ((time - 2.55) * 3 + dust_index * 0.28) % 1
                draw_dust(draw, x + 38 + dust_index * 10, 490, age)

        # The crowd arrives as a dense, overlapping pack rather than rows.
        if 2.72 <= time < 4.55:
            progress = ease_in_out((time - 2.72) / 1.83)
            group_x = 440 + (-470 - 440) * progress
            ordered = sorted(crowd, key=lambda member: member.y)
            for member in ordered:
                local_index = index * 2 + member.phase
                bob = abs(math.sin((index + member.phase) * 0.7)) * (7 if member.y > 500 else 5)
                squash = 0.96 + 0.08 * abs(math.sin((index + member.phase) * 0.7))
                paste_sprite(
                    frame,
                    sprites[member.pokemon_id].frame(local_index),
                    group_x + member.x,
                    member.y - bob,
                    member.scale,
                    member.lean,
                    squash,
                )
            for dust_index in range(10):
                age = ((time - 2.72) * 2.2 + dust_index * 0.13) % 1
                draw_dust(draw, group_x + 90 + dust_index * 22, 565, age)

        # End on pure white so the app can switch screens without a visible seam.
        if time >= 3.85:
            fade = ease_in_out((time - 3.85) / 0.85)
            overlay = Image.new("RGBA", LOGICAL_SIZE, (255, 255, 255, round(255 * fade)))
            frame.alpha_composite(overlay)

        frames.append(frame.convert("RGB").resize(OUTPUT_SIZE, Image.Resampling.NEAREST))

    return frames


def save_gif(frames: list[Image.Image], output_path: Path) -> None:
    preview_frames = [frame.resize(LOGICAL_SIZE, Image.Resampling.NEAREST) for frame in frames]
    preview_frames[0].save(
        output_path,
        save_all=True,
        append_images=preview_frames[1:],
        duration=round(1000 / FPS),
        loop=0,
        optimize=True,
        disposal=2,
    )


def save_storyboard(frames: list[Image.Image], output_path: Path) -> None:
    sample_indexes = (0, 12, 24, 40, 47, 55, 63, 72, 84, 99)
    thumb_size = (180, 320)
    sheet = Image.new("RGB", (thumb_size[0] * 5, thumb_size[1] * 2), "white")
    for position, frame_index in enumerate(sample_indexes):
        thumb = frames[frame_index].resize(thumb_size, Image.Resampling.NEAREST)
        x = (position % 5) * thumb_size[0]
        y = (position // 5) * thumb_size[1]
        sheet.paste(thumb, (x, y))
    sheet.save(output_path)


def save_mp4(frames: list[Image.Image], output_path: Path) -> bool:
    try:
        import imageio_ffmpeg
    except ImportError:
        return False

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    command = [
        ffmpeg,
        "-y",
        "-f",
        "rawvideo",
        "-vcodec",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-s",
        f"{OUTPUT_SIZE[0]}x{OUTPUT_SIZE[1]}",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-an",
        "-vcodec",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(output_path),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert process.stdin is not None
    for frame in frames:
        process.stdin.write(np.asarray(frame, dtype=np.uint8).tobytes())
    process.stdin.close()
    return process.wait() == 0


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    frames = render_frames()
    gif_path = OUTPUT_DIR / "pokemon-intro-preview.gif"
    storyboard_path = OUTPUT_DIR / "pokemon-intro-storyboard.png"
    mp4_path = OUTPUT_DIR / "pokemon-intro.mp4"

    save_gif(frames, gif_path)
    save_storyboard(frames, storyboard_path)
    mp4_written = save_mp4(frames, mp4_path)
    print(f"GIF: {gif_path}")
    print(f"Storyboard: {storyboard_path}")
    if mp4_written:
        print(f"MP4: {mp4_path}")
    else:
        print("MP4: skipped (imageio-ffmpeg is not installed)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
