import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PNG } = require("pngjs");

const sourcePath = process.argv[2];
const outputDir = process.argv[3] ?? path.join("assets", "images", "platinum-intro");

if (!sourcePath) {
  throw new Error(
    "Usage: node scripts/create-platinum-intro-assets.mjs <source.png> [output-dir]",
  );
}

const source = PNG.sync.read(fs.readFileSync(sourcePath));

function crop(image, x, y, width, height) {
  const result = new PNG({ width, height });

  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const sourceOffset = ((y + row) * image.width + x + column) * 4;
      const targetOffset = (row * width + column) * 4;
      image.data.copy(result.data, targetOffset, sourceOffset, sourceOffset + 4);
    }
  }

  return result;
}

function clearConnectedWhite(image) {
  const visited = new Uint8Array(image.width * image.height);
  const queue = [];

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
    const index = y * image.width + x;
    if (visited[index]) return;
    visited[index] = 1;

    const offset = index * 4;
    const isSheetBackground =
      image.data[offset] >= 248 &&
      image.data[offset + 1] >= 248 &&
      image.data[offset + 2] >= 248;

    if (isSheetBackground) queue.push(index);
  };

  for (let x = 0; x < image.width; x += 1) {
    enqueue(x, 0);
    enqueue(x, image.height - 1);
  }

  for (let y = 0; y < image.height; y += 1) {
    enqueue(0, y);
    enqueue(image.width - 1, y);
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor];
    const x = index % image.width;
    const y = Math.floor(index / image.width);
    const offset = index * 4;
    image.data[offset] = 0;
    image.data[offset + 1] = 0;
    image.data[offset + 2] = 0;
    image.data[offset + 3] = 0;

    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  return image;
}

function composeStrip(frames) {
  const frameWidth = frames[0].width;
  const frameHeight = frames[0].height;
  const strip = new PNG({ width: frameWidth * frames.length, height: frameHeight });
  strip.data.fill(0);

  frames.forEach((frame, frameIndex) => {
    for (let y = 0; y < frameHeight; y += 1) {
      for (let x = 0; x < frameWidth; x += 1) {
        const sourceOffset = (y * frameWidth + x) * 4;
        const targetOffset =
          (y * strip.width + frameIndex * frameWidth + x) * 4;
        frame.data.copy(strip.data, targetOffset, sourceOffset, sourceOffset + 4);
      }
    }
  });

  return strip;
}

function shiftedFrame(frame, dy) {
  const shifted = new PNG({ width: frame.width, height: frame.height });
  shifted.data.fill(0);

  for (let y = 0; y < frame.height; y += 1) {
    const targetY = y + dy;
    if (targetY < 0 || targetY >= frame.height) continue;

    const sourceOffset = y * frame.width * 4;
    const targetOffset = targetY * frame.width * 4;
    frame.data.copy(
      shifted.data,
      targetOffset,
      sourceOffset,
      sourceOffset + frame.width * 4,
    );
  }

  return shifted;
}

function clearRect(image, x, y, width, height) {
  for (let row = y; row < Math.min(y + height, image.height); row += 1) {
    for (let column = x; column < Math.min(x + width, image.width); column += 1) {
      const offset = (row * image.width + column) * 4;
      image.data[offset] = 0;
      image.data[offset + 1] = 0;
      image.data[offset + 2] = 0;
      image.data[offset + 3] = 0;
    }
  }
  return image;
}

function keepLargestOpaqueComponent(image) {
  const visited = new Uint8Array(image.width * image.height);
  const components = [];

  for (let start = 0; start < image.width * image.height; start += 1) {
    if (visited[start] || image.data[start * 4 + 3] === 0) continue;
    const queue = [start];
    const component = [];
    visited[start] = 1;

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor];
      component.push(index);
      const x = index % image.width;
      const y = Math.floor(index / image.width);

      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nextX = x + dx;
          const nextY = y + dy;
          if (nextX < 0 || nextY < 0 || nextX >= image.width || nextY >= image.height) continue;
          const next = nextY * image.width + nextX;
          if (visited[next] || image.data[next * 4 + 3] === 0) continue;
          visited[next] = 1;
          queue.push(next);
        }
      }
    }

    components.push(component);
  }

  components.sort((left, right) => right.length - left.length);
  const keep = new Set(components[0] ?? []);

  for (let index = 0; index < image.width * image.height; index += 1) {
    if (!keep.has(index)) image.data[index * 4 + 3] = 0;
  }

  return image;
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type, "ascii");
  const result = Buffer.alloc(12 + data.length);
  result.writeUInt32BE(data.length, 0);
  typeBuffer.copy(result, 4);
  data.copy(result, 8);
  result.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return result;
}

function encodeFrame(frame) {
  const stride = frame.width * 4 + 1;
  const scanlines = Buffer.alloc(stride * frame.height);

  for (let y = 0; y < frame.height; y += 1) {
    const rowOffset = y * stride;
    scanlines[rowOffset] = 0;
    frame.data.copy(
      scanlines,
      rowOffset + 1,
      y * frame.width * 4,
      (y + 1) * frame.width * 4,
    );
  }

  return zlib.deflateSync(scanlines, { level: 9 });
}

function encodeApng(frames, delaysMs) {
  const width = frames[0].width;
  const height = frames[0].height;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const animationControl = Buffer.alloc(8);
  animationControl.writeUInt32BE(frames.length, 0);
  animationControl.writeUInt32BE(0, 4);

  const chunks = [signature, chunk("IHDR", ihdr), chunk("acTL", animationControl)];
  let sequence = 0;

  frames.forEach((frame, index) => {
    const frameControl = Buffer.alloc(26);
    frameControl.writeUInt32BE(sequence, 0);
    sequence += 1;
    frameControl.writeUInt32BE(width, 4);
    frameControl.writeUInt32BE(height, 8);
    frameControl.writeUInt32BE(0, 12);
    frameControl.writeUInt32BE(0, 16);
    frameControl.writeUInt16BE(delaysMs[index], 20);
    frameControl.writeUInt16BE(1000, 22);
    frameControl[24] = 0;
    frameControl[25] = 0;
    chunks.push(chunk("fcTL", frameControl));

    const compressed = encodeFrame(frame);
    if (index === 0) {
      chunks.push(chunk("IDAT", compressed));
    } else {
      const frameData = Buffer.alloc(compressed.length + 4);
      frameData.writeUInt32BE(sequence, 0);
      sequence += 1;
      compressed.copy(frameData, 4);
      chunks.push(chunk("fdAT", frameData));
    }
  });

  chunks.push(chunk("IEND"));
  return Buffer.concat(chunks);
}

function extractFrames(rectangles) {
  return rectangles.map(({ x, y, width, height }) =>
    clearConnectedWhite(crop(source, x, y, width, height)),
  );
}

function saveAnimation(name, frames, delaysMs) {
  fs.writeFileSync(
    path.join(outputDir, `${name}-strip.png`),
    PNG.sync.write(composeStrip(frames)),
  );
  fs.writeFileSync(path.join(outputDir, `${name}.png`), encodeApng(frames, delaysMs));
}

fs.mkdirSync(outputDir, { recursive: true });

const dawnFrames = extractFrames([
  { x: 198, y: 510, width: 64, height: 132 },
  { x: 266, y: 510, width: 64, height: 132 },
  { x: 332, y: 510, width: 64, height: 132 },
  { x: 398, y: 510, width: 64, height: 132 },
]);

const lucasFrames = extractFrames([
  { x: 169, y: 670, width: 64, height: 124 },
  { x: 233, y: 670, width: 64, height: 124 },
  { x: 298, y: 670, width: 64, height: 124 },
  { x: 363, y: 670, width: 64, height: 124 },
]);

const rowanBase = extractFrames([
  { x: 613, y: 292, width: 76, height: 132 },
])[0];
clearRect(rowanBase, 0, 84, 25, 48);
keepLargestOpaqueComponent(rowanBase);
const rowanFrames = [
  shiftedFrame(rowanBase, 1),
  shiftedFrame(rowanBase, 0),
  shiftedFrame(rowanBase, 1),
  shiftedFrame(rowanBase, 2),
];

saveAnimation("dawn-run", dawnFrames, [200, 200, 200, 200]);
saveAnimation("lucas-run", lucasFrames, [200, 200, 200, 200]);
saveAnimation("prof-rowan-idle", rowanFrames, [650, 650, 650, 650]);

const manifest = {
  format: "APNG",
  note: "Animated PNG files intentionally use the .png extension for Metro static asset imports.",
  animations: {
    dawnRun: { frameWidth: 64, frameHeight: 132, frameCount: 4, frameDurationMs: 200 },
    lucasRun: { frameWidth: 64, frameHeight: 124, frameCount: 4, frameDurationMs: 200 },
    profRowanIdle: { frameWidth: 76, frameHeight: 132, frameCount: 4, frameDurationMs: 650 },
  },
};

fs.writeFileSync(
  path.join(outputDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(`Created Platinum intro assets in ${path.resolve(outputDir)}`);
