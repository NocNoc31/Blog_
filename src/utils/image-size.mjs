import fs from 'node:fs';

function u16(data, offset, little) {
  return little ? data.readUInt16LE(offset) : data.readUInt16BE(offset);
}

function u32(data, offset, little) {
  return little ? data.readUInt32LE(offset) : data.readUInt32BE(offset);
}

function pngSize(data) {
  if (data.length < 24 || data.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: u32(data, 16, false), height: u32(data, 20, false) };
}

function gifSize(data) {
  if (data.length < 10) return null;
  return { width: u16(data, 6, true), height: u16(data, 8, true) };
}

function jpegSize(data) {
  let offset = 2;
  while (offset + 8 < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = data[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    if (marker >= 0xc0 && marker <= 0xc2) {
      return { height: u16(data, offset + 5, false), width: u16(data, offset + 7, false) };
    }
    const length = u16(data, offset + 2, false);
    if (length < 2) return null;
    offset += 2 + length;
  }
  return null;
}

function webpSize(data) {
  if (data.length < 30 || data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WEBP') {
    return null;
  }
  const format = data.toString('ascii', 12, 16);
  if (format === 'VP8 ' && data.length >= 30) {
    return { width: u16(data, 26, true) & 0x3fff, height: u16(data, 28, true) & 0x3fff };
  }
  if (format === 'VP8L' && data.length >= 25) {
    const bits = data.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (format === 'VP8X' && data.length >= 30) {
    return {
      width: 1 + (data[24] | (data[25] << 8) | (data[26] << 16)),
      height: 1 + (data[27] | (data[28] << 8) | (data[29] << 16)),
    };
  }
  return null;
}

/** Pixel size of a local PNG, JPEG, GIF, or WebP file, or null if it cannot be read. */
export function readImageSize(filePath) {
  let data;
  try {
    data = fs.readFileSync(filePath);
  } catch {
    return null;
  }
  const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
  const size = ext === '.png' ? pngSize(data)
    : ext === '.gif' ? gifSize(data)
    : ext === '.webp' ? webpSize(data)
    : (ext === '.jpg' || ext === '.jpeg') ? jpegSize(data)
    : null;
  if (!size || size.width < 1 || size.height < 1) return null;
  return size;
}
