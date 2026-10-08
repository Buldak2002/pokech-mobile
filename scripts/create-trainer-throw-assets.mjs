import { deflateSync, inflateSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const SOURCE_SIZE = { width: 811, height: 883 };
const FRAME_SIZE = 80;
const FRAME_COUNT = 5;
const FRAME_GAP = 81;
const FRAME_START_X = 1;
const BACKGROUND = [84, 165, 75];
const DURATIONS = [140, 120, 120, 130, 180, 320];
const OUTPUTS = [
  { suffix: '', size: 240 },
  { suffix: '@2x', size: 480 },
  { suffix: '@3x', size: 720 },
];
const CHARACTERS = [
  { id: 'dawn-pt', y: 508 },
  { id: 'lucas-pt', y: 606 },
];

const sourcePath = process.argv[2];
const outputDirectory = resolve(
  process.argv[3] ?? 'assets/images/trainer-throw',
);

if (!sourcePath) {
  throw new Error(
    'Usage: node scripts/create-trainer-throw-assets.mjs <sprite-sheet.png> [output-directory]',
  );
}

function makeCrcTable() {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }

  return table;
}

const CRC_TABLE = makeCrcTable();

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);

  length.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function readChunks(png) {
  if (!png.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error('The source is not a PNG file.');
  }

  const chunks = [];
  let offset = PNG_SIGNATURE.length;

  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    chunks.push({ type, data: png.subarray(dataStart, dataEnd) });
    offset = dataEnd + 4;

    if (type === 'IEND') {
      break;
    }
  }

  return chunks;
}

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);

  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) {
    return left;
  }
  if (aboveDistance <= upperLeftDistance) {
    return above;
  }
  return upperLeft;
}

function decodeScanlines(compressed, width, height) {
  const inflated = inflateSync(compressed);
  const bytesPerPixel = 4;
  const rowLength = width * bytesPerPixel;
  const expectedLength = height * (rowLength + 1);

  if (inflated.length !== expectedLength) {
    throw new Error(
      `Unexpected pixel data length: ${inflated.length}, expected ${expectedLength}.`,
    );
  }

  const pixels = Buffer.alloc(width * height * bytesPerPixel);
  let sourceOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;

    for (let x = 0; x < rowLength; x += 1) {
      const raw = inflated[sourceOffset + x];
      const destinationOffset = y * rowLength + x;
      const left = x >= bytesPerPixel
        ? pixels[destinationOffset - bytesPerPixel]
        : 0;
      const above = y > 0 ? pixels[destinationOffset - rowLength] : 0;
      const upperLeft = y > 0 && x >= bytesPerPixel
        ? pixels[destinationOffset - rowLength - bytesPerPixel]
        : 0;

      let value;
      switch (filter) {
        case 0:
          value = raw;
          break;
        case 1:
          value = raw + left;
          break;
        case 2:
          value = raw + above;
          break;
        case 3:
          value = raw + Math.floor((left + above) / 2);
          break;
        case 4:
          value = raw + paeth(left, above, upperLeft);
          break;
        default:
          throw new Error(`Unsupported PNG filter: ${filter}.`);
      }

      pixels[destinationOffset] = value & 0xff;
    }

    sourceOffset += rowLength;
  }

  return pixels;
}

function decodeRgbaPng(png) {
  const chunks = readChunks(png);
  const header = chunks.find((chunk) => chunk.type === 'IHDR')?.data;

  if (!header) {
    throw new Error('PNG is missing IHDR.');
  }

  const width = header.readUInt32BE(0);
  const height = header.readUInt32BE(4);
  const bitDepth = header[8];
  const colorType = header[9];
  const interlace = header[12];

  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error(
      `Expected a non-interlaced 8-bit RGBA PNG, received bitDepth=${bitDepth}, colorType=${colorType}, interlace=${interlace}.`,
    );
  }

  const compressed = Buffer.concat(
    chunks.filter((chunk) => chunk.type === 'IDAT').map((chunk) => chunk.data),
  );

  return {
    width,
    height,
    pixels: decodeScanlines(compressed, width, height),
  };
}

function cropFrame(source, frameIndex, y) {
  const pixels = Buffer.alloc(FRAME_SIZE * FRAME_SIZE * 4);
  const startX = FRAME_START_X + FRAME_GAP * frameIndex;

  for (let frameY = 0; frameY < FRAME_SIZE; frameY += 1) {
    for (let frameX = 0; frameX < FRAME_SIZE; frameX += 1) {
      const sourceOffset =
        ((y + frameY) * source.width + startX + frameX) * 4;
      const targetOffset = (frameY * FRAME_SIZE + frameX) * 4;
      const red = source.pixels[sourceOffset];
      const green = source.pixels[sourceOffset + 1];
      const blue = source.pixels[sourceOffset + 2];

      if (
        red === BACKGROUND[0] &&
        green === BACKGROUND[1] &&
        blue === BACKGROUND[2]
      ) {
        pixels[targetOffset] = 0;
        pixels[targetOffset + 1] = 0;
        pixels[targetOffset + 2] = 0;
        pixels[targetOffset + 3] = 0;
      } else {
        source.pixels.copy(pixels, targetOffset, sourceOffset, sourceOffset + 4);
      }
    }
  }

  return pixels;
}

function resizeNearest(pixels, sourceSize, targetSize) {
  const scale = targetSize / sourceSize;

  if (!Number.isInteger(scale)) {
    throw new Error(`Target size ${targetSize} is not an integer scale.`);
  }

  const output = Buffer.alloc(targetSize * targetSize * 4);

  for (let y = 0; y < targetSize; y += 1) {
    const sourceY = Math.floor(y / scale);
    for (let x = 0; x < targetSize; x += 1) {
      const sourceX = Math.floor(x / scale);
      const sourceOffset = (sourceY * sourceSize + sourceX) * 4;
      const targetOffset = (y * targetSize + x) * 4;
      pixels.copy(output, targetOffset, sourceOffset, sourceOffset + 4);
    }
  }

  return output;
}

function encodeScanlines(pixels, width, height) {
  const rowLength = width * 4;
  const scanlines = Buffer.alloc(height * (rowLength + 1));

  for (let y = 0; y < height; y += 1) {
    const scanlineOffset = y * (rowLength + 1);
    scanlines[scanlineOffset] = 0;
    pixels.copy(
      scanlines,
      scanlineOffset + 1,
      y * rowLength,
      (y + 1) * rowLength,
    );
  }

  return deflateSync(scanlines, { level: 9 });
}

function makeHeader(width, height) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;
  return header;
}

function encodePng(pixels, width, height) {
  return Buffer.concat([
    PNG_SIGNATURE,
    makeChunk('IHDR', makeHeader(width, height)),
    makeChunk('IDAT', encodeScanlines(pixels, width, height)),
    makeChunk('IEND'),
  ]);
}

function makeFrameControl(sequence, width, height, duration) {
  const control = Buffer.alloc(26);
  control.writeUInt32BE(sequence, 0);
  control.writeUInt32BE(width, 4);
  control.writeUInt32BE(height, 8);
  control.writeUInt32BE(0, 12);
  control.writeUInt32BE(0, 16);
  control.writeUInt16BE(duration, 20);
  control.writeUInt16BE(1000, 22);
  control[24] = 0;
  control[25] = 0;
  return control;
}

function encodeApng(frames, width, height, durations) {
  const animationControl = Buffer.alloc(8);
  animationControl.writeUInt32BE(frames.length, 0);
  animationControl.writeUInt32BE(1, 4);

  const chunks = [
    PNG_SIGNATURE,
    makeChunk('IHDR', makeHeader(width, height)),
    makeChunk('acTL', animationControl),
  ];
  let sequence = 0;

  frames.forEach((frame, index) => {
    chunks.push(
      makeChunk('fcTL', makeFrameControl(sequence, width, height, durations[index])),
    );
    sequence += 1;

    const compressed = encodeScanlines(frame, width, height);
    if (index === 0) {
      chunks.push(makeChunk('IDAT', compressed));
      return;
    }

    const frameData = Buffer.alloc(compressed.length + 4);
    frameData.writeUInt32BE(sequence, 0);
    compressed.copy(frameData, 4);
    chunks.push(makeChunk('fdAT', frameData));
    sequence += 1;
  });

  chunks.push(makeChunk('IEND'));
  return Buffer.concat(chunks);
}

function assertPixelsEqual(actual, expected, message) {
  if (!actual.equals(expected)) {
    throw new Error(message);
  }
}

function verifyApng(filePath, expectedFrames, size) {
  const png = readFileSync(filePath);
  const chunks = readChunks(png);
  const header = chunks.find((chunk) => chunk.type === 'IHDR')?.data;
  const animationControl = chunks.find((chunk) => chunk.type === 'acTL')?.data;
  const frameControls = chunks.filter((chunk) => chunk.type === 'fcTL');

  if (!header || header.readUInt32BE(0) !== size || header.readUInt32BE(4) !== size) {
    throw new Error(`${filePath}: expected ${size}x${size}.`);
  }
  if (
    !animationControl ||
    animationControl.readUInt32BE(0) !== 6 ||
    animationControl.readUInt32BE(4) !== 1
  ) {
    throw new Error(`${filePath}: expected 6 frames and num_plays=1.`);
  }

  const actualDurations = frameControls.map((chunk) => {
    const numerator = chunk.data.readUInt16BE(20);
    const denominator = chunk.data.readUInt16BE(22) || 100;
    return (numerator / denominator) * 1000;
  });

  if (actualDurations.join(',') !== DURATIONS.join(',')) {
    throw new Error(`${filePath}: frame durations do not match.`);
  }

  const compressedFrames = [];
  let currentFrame = -1;

  for (const chunk of chunks) {
    if (chunk.type === 'fcTL') {
      currentFrame += 1;
      compressedFrames[currentFrame] = [];
    } else if (chunk.type === 'IDAT') {
      compressedFrames[currentFrame].push(chunk.data);
    } else if (chunk.type === 'fdAT') {
      compressedFrames[currentFrame].push(chunk.data.subarray(4));
    }
  }

  compressedFrames.forEach((compressedParts, index) => {
    const decoded = decodeScanlines(Buffer.concat(compressedParts), size, size);
    assertPixelsEqual(
      decoded,
      expectedFrames[index],
      `${filePath}: frame ${index} pixels changed during encoding.`,
    );

    let transparentPixels = 0;
    for (let offset = 0; offset < decoded.length; offset += 4) {
      if (decoded[offset + 3] === 0) {
        transparentPixels += 1;
      }
      if (
        decoded[offset] === BACKGROUND[0] &&
        decoded[offset + 1] === BACKGROUND[1] &&
        decoded[offset + 2] === BACKGROUND[2] &&
        decoded[offset + 3] !== 0
      ) {
        throw new Error(`${filePath}: opaque #54A54B pixel remains.`);
      }
    }

    if (transparentPixels === 0) {
      throw new Error(`${filePath}: frame ${index} has no transparent background.`);
    }
  });
}

const source = decodeRgbaPng(readFileSync(resolve(sourcePath)));

if (
  source.width !== SOURCE_SIZE.width ||
  source.height !== SOURCE_SIZE.height
) {
  throw new Error(
    `Expected ${SOURCE_SIZE.width}x${SOURCE_SIZE.height}, received ${source.width}x${source.height}.`,
  );
}

mkdirSync(outputDirectory, { recursive: true });

for (const character of CHARACTERS) {
  const originalFrames = Array.from({ length: FRAME_COUNT }, (_, frameIndex) =>
    cropFrame(source, frameIndex, character.y),
  );
  const animationFrames = [...originalFrames, originalFrames[0]];

  for (const output of OUTPUTS) {
    const scaledFrames = animationFrames.map((frame) =>
      resizeNearest(frame, FRAME_SIZE, output.size),
    );
    const animationPath = join(
      outputDirectory,
      `${character.id}-throw${output.suffix}.png`,
    );
    const idlePath = join(
      outputDirectory,
      `${character.id}-idle${output.suffix}.png`,
    );

    writeFileSync(
      animationPath,
      encodeApng(scaledFrames, output.size, output.size, DURATIONS),
    );
    writeFileSync(
      idlePath,
      encodePng(scaledFrames[0], output.size, output.size),
    );
    verifyApng(animationPath, scaledFrames, output.size);

    console.log(
      `${character.id}: ${output.size}x${output.size}, 6 frames, loop=1 -> ${animationPath}`,
    );
  }
}

console.log(`Assets written to ${outputDirectory}`);
