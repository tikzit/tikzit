import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const imagesDir = path.join(rootDir, 'images');
const targetDir = path.join(rootDir, 'public', 'icons');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const requiredFiles = [
  'tikzit-tool-select.svg',
  'tikzit-tool-node.svg',
  'tikzit-tool-edge.svg',
  'crop.svg',
  'document-new.svg',
  'document-open.svg',
  'text-x-generic_with_pencil.svg',
  'refresh.svg',
  'tikzit.svg',
  'tikzit.png'
];

let copied = 0;
for (const file of requiredFiles) {
  const src = path.join(imagesDir, file);
  const dst = path.join(targetDir, file);

  if (!fs.existsSync(src)) {
    console.warn(`[sync-desktop-icons] Warning: Source ${file} does not exist in images/`);
    continue;
  }

  const srcBuf = fs.readFileSync(src);
  let shouldCopy = true;

  if (fs.existsSync(dst)) {
    const dstBuf = fs.readFileSync(dst);
    const hashSrc = crypto.createHash('sha256').update(srcBuf).digest('hex');
    const hashDst = crypto.createHash('sha256').update(dstBuf).digest('hex');
    if (hashSrc === hashDst) {
      shouldCopy = false;
    }
  }

  if (shouldCopy) {
    fs.writeFileSync(dst, srcBuf);
    copied++;
  }
}

console.log(`[sync-desktop-icons] Verified ${requiredFiles.length} icons (${copied} synchronized) into public/icons/`);
