import fs from 'node:fs';
import path from 'node:path';

const rasterExtensions = ['.png', '.jpg', '.jpeg'];

function publicDir() {
  return path.join(process.cwd(), 'public');
}

function existsPublic(relativePath) {
  return fs.existsSync(path.join(publicDir(), relativePath));
}

function splitSuffix(value) {
  const match = String(value).trim().match(/^([^?#]*)([?#].*)?$/);
  return { pathOnly: match[1], suffix: match[2] || '' };
}

/**
 * Find the hero files for an extensionless (or extended) public image path.
 * `src` is the first existing .png, .jpg, or .jpeg. `webp` is set only when that file exists.
 */
export function resolveHeroImage(image) {
  if (typeof image !== 'string' || !image.trim()) {
    return { src: null, webp: null };
  }

  const { pathOnly, suffix } = splitSuffix(image);
  const ext = path.extname(pathOnly).toLowerCase();
  const stem = ext ? pathOnly.slice(0, -ext.length) : pathOnly;
  const stemRelative = stem.replace(/^\//, '');

  let raster = null;
  if (rasterExtensions.includes(ext) && existsPublic(pathOnly.replace(/^\//, ''))) {
    raster = pathOnly;
  } else {
    const found = rasterExtensions.find((candidate) => existsPublic(stemRelative + candidate));
    if (found) raster = stem + found;
  }

  const webp = existsPublic(stemRelative + '.webp') ? `${stem}.webp` : null;

  return {
    src: raster ? raster + suffix : null,
    webp: webp ? webp + suffix : null,
  };
}

/** Path for og:image. Missing files fall back to /social.png (no invented .png). */
export function resolveOgImagePath(image) {
  const { src, webp } = resolveHeroImage(image);
  return src || webp || '/social.png';
}
