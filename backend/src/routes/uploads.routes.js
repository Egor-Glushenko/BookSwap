import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { extname } from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { config } from '../config/env.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler, badRequest } from '../lib/errors.js';

mkdirSync(config.uploadDir, { recursive: true });

const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, config.uploadDir),
  filename: (_request, file, callback) => {
    const extension = ALLOWED[file.mimetype] || extname(file.originalname).toLowerCase() || '.jpg';
    callback(null, `${Date.now()}-${randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!ALLOWED[file.mimetype]) return callback(badRequest('Поддерживаются JPEG, PNG и WebP'));
    callback(null, true);
  }
});

const router = Router();

/** Verifies magic bytes so a renamed .exe cannot pass as .png. */
function looksLikeImage(buffer) {
  if (buffer.length < 12) return false;
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return isJpeg || isPng || isWebp;
}

router.post('/image', requireAuth, upload.single('image'), asyncHandler(async (request, response) => {
  if (!request.file) throw badRequest('Выберите файл изображения');

  const contents = await readFile(request.file.path);
  if (!looksLikeImage(contents)) {
    await unlink(request.file.path).catch(() => {});
    throw badRequest('Файл повреждён или не является изображением JPEG, PNG или WebP');
  }

  const path = `${config.uploadsPublicPath}/${request.file.filename}`;
  response.status(201).json({
    data: {
      url: path,
      absoluteUrl: `${request.protocol}://${request.get('host')}${path}`,
      size: request.file.size,
      mimeType: request.file.mimetype
    }
  });
}));

export default router;
