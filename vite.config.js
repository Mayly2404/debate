import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs/promises';
import path from 'node:path';

const SOUND_PUBLIC_DIR = path.resolve(__dirname, 'public', 'sounds');
const SOUND_DIST_DIR = path.resolve(__dirname, 'dist', 'sounds');
const AVATAR_PUBLIC_DIR = path.resolve(__dirname, 'public', 'avatars');
const AVATAR_DIST_DIR = path.resolve(__dirname, 'dist', 'avatars');
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_SYNC_BYTES = 12 * 1024 * 1024;
const DEV_PORT = Number(process.env.VITE_DEV_PORT || 5173);
const PREVIEW_PORT = Number(process.env.VITE_PREVIEW_PORT || 4173);
const ALLOWED_TUNNEL_HOSTS = ['raccoon.edu.vn', 'vite.raccoon.edu.vn', 'localhost', '127.0.0.1'];

function safeBaseName(filename = 'sound') {
  const parsed = path.parse(filename);
  const clean = (parsed.name || 'sound')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return clean || 'sound';
}

function pickExt(filename = '', mime = '', kind = 'sound') {
  const currentExt = path.extname(filename).toLowerCase();
  if (currentExt) return currentExt;
  const extByMime = {
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'audio/x-wav': '.wav',
    'audio/ogg': '.ogg',
    'audio/webm': '.webm',
    'audio/mp4': '.m4a',
    'audio/x-m4a': '.m4a',
    'audio/aac': '.aac',
    'audio/flac': '.flac',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg'
  };
  return extByMime[mime] || (kind === 'image' ? '.png' : '.mp3');
}

function decodeDataUrl(dataUrl = '') {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!match) throw new Error('INVALID_DATA_URL');
  return {
    mime: match[1],
    buffer: Buffer.from(match[2], 'base64')
  };
}

function sendJson(res, code, payload) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function getUploadTarget(pathname) {
  if (pathname === '/api/upload-sound') {
    return {
      kind: 'sound',
      publicDir: SOUND_PUBLIC_DIR,
      distDir: SOUND_DIST_DIR,
      urlPrefix: '/sounds/',
      mimePrefix: 'audio/'
    };
  }
  if (pathname === '/api/upload-image') {
    return {
      kind: 'image',
      publicDir: AVATAR_PUBLIC_DIR,
      distDir: AVATAR_DIST_DIR,
      urlPrefix: '/avatars/',
      mimePrefix: 'image/'
    };
  }
  return null;
}

function createUploadMiddleware() {
  return (req, res, next) => {
    const pathname = req.url ? req.url.split('?')[0] : '';
    const target = getUploadTarget(pathname);
    if (!target) return next();

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
      return;
    }

    let totalBytes = 0;
    const chunks = [];
    let aborted = false;

    req.on('data', (chunk) => {
      if (aborted) return;
      totalBytes += chunk.length;
      if (totalBytes > MAX_UPLOAD_BYTES) {
        aborted = true;
        sendJson(res, 413, { error: 'FILE_TOO_LARGE' });
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', async () => {
      if (aborted) return;
      try {
        const rawBody = Buffer.concat(chunks).toString('utf-8');
        const parsed = JSON.parse(rawBody || '{}');
        const filename = String(parsed.filename || 'sound');
        const dataUrl = String(parsed.dataUrl || '');
        if (!dataUrl) {
          sendJson(res, 400, { error: 'MISSING_DATA_URL' });
          return;
        }
        const { mime, buffer } = decodeDataUrl(dataUrl);
        if (!String(mime || '').startsWith(target.mimePrefix)) {
          sendJson(res, 415, { error: 'UNSUPPORTED_MEDIA_TYPE' });
          return;
        }
        const saveName = `${safeBaseName(filename)}-${Date.now()}${pickExt(filename, mime, target.kind)}`;

        await fs.mkdir(target.publicDir, { recursive: true });
        await fs.writeFile(path.join(target.publicDir, saveName), buffer);
        try {
          await fs.mkdir(target.distDir, { recursive: true });
          await fs.writeFile(path.join(target.distDir, saveName), buffer);
        } catch {}

        sendJson(res, 200, { url: `${target.urlPrefix}${saveName}` });
      } catch {
        sendJson(res, 400, { error: 'UPLOAD_FAILED' });
      }
    });

    req.on('error', () => {
      if (!res.writableEnded) sendJson(res, 500, { error: 'UPLOAD_STREAM_ERROR' });
    });
  };
}

function soundUploadPlugin() {
  const uploadMiddleware = createUploadMiddleware();
  return {
    name: 'sound-upload-plugin',
    configureServer(server) {
      server.middlewares.use(uploadMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(uploadMiddleware);
    }
  };
}

function readJsonBody(req, maxBytes = MAX_SYNC_BYTES) {
  return new Promise((resolve, reject) => {
    let totalBytes = 0;
    const chunks = [];
    let finished = false;

    const done = (fn, value) => {
      if (finished) return;
      finished = true;
      fn(value);
    };

    req.on('data', (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        req.destroy();
        done(reject, new Error('PAYLOAD_TOO_LARGE'));
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (finished) return;
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        done(resolve, raw ? JSON.parse(raw) : {});
      } catch {
        done(reject, new Error('INVALID_JSON'));
      }
    });

    req.on('error', () => done(reject, new Error('READ_STREAM_FAILED')));
  });
}

function createRealtimeSyncMiddleware() {
  let serializedState = '';
  let stateVersion = 0;
  let updatedAt = 0;
  const clients = new Set();

  const broadcast = (payload) => {
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    clients.forEach((res) => {
      try {
        res.write(data);
      } catch {
        clients.delete(res);
      }
    });
  };

  return async (req, res, next) => {
    const pathname = req.url ? req.url.split('?')[0] : '';
    if (pathname === '/api/sync-events') {
      if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();
      res.write(': connected\n\n');
      clients.add(res);

      if (serializedState) {
        res.write(`data: ${JSON.stringify({
          type: 'state',
          serialized: serializedState,
          version: stateVersion,
          updatedAt,
          initial: true
        })}\n\n`);
      }

      const keepAlive = setInterval(() => {
        try {
          res.write(': keepalive\n\n');
        } catch {
          clearInterval(keepAlive);
          clients.delete(res);
        }
      }, 15000);

      req.on('close', () => {
        clearInterval(keepAlive);
        clients.delete(res);
      });
      return;
    }

    if (pathname !== '/api/sync-state') return next();
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'GET') {
      let payload = null;
      if (serializedState) {
        try {
          payload = JSON.parse(serializedState);
        } catch {}
      }
      sendJson(res, 200, {
        serialized: serializedState,
        payload,
        version: stateVersion,
        updatedAt
      });
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
      return;
    }

    try {
      const body = await readJsonBody(req, MAX_SYNC_BYTES);
      const incomingSerialized = typeof body?.serialized === 'string' ? body.serialized : '';
      if (!incomingSerialized) {
        sendJson(res, 400, { error: 'MISSING_SERIALIZED_STATE' });
        return;
      }

      if (incomingSerialized !== serializedState) {
        serializedState = incomingSerialized;
        stateVersion += 1;
        updatedAt = Date.now();
        broadcast({
          type: 'state',
          serialized: serializedState,
          version: stateVersion,
          updatedAt,
          sourceId: typeof body?.sourceId === 'string' ? body.sourceId : ''
        });
      }

      sendJson(res, 200, { ok: true, version: stateVersion, updatedAt });
    } catch (error) {
      if (error?.message === 'PAYLOAD_TOO_LARGE') {
        sendJson(res, 413, { error: 'PAYLOAD_TOO_LARGE' });
        return;
      }
      sendJson(res, 400, { error: 'SYNC_REQUEST_FAILED' });
    }
  };
}

function realtimeSyncPlugin() {
  const syncMiddleware = createRealtimeSyncMiddleware();
  return {
    name: 'realtime-sync-plugin',
    configureServer(server) {
      server.middlewares.use(syncMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(syncMiddleware);
    }
  };
}

export default defineConfig({
  plugins: [react(), soundUploadPlugin(), realtimeSyncPlugin()],
  server: {
    host: '0.0.0.0',
    port: DEV_PORT,
    strictPort: true,
    allowedHosts: ALLOWED_TUNNEL_HOSTS
  },
  preview: {
    host: '0.0.0.0',
    port: PREVIEW_PORT,
    strictPort: true
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        host: path.resolve(__dirname, 'host.html'),
        ungho: path.resolve(__dirname, 'ungho.html'),
        phandoi: path.resolve(__dirname, 'phandoi.html'),
        user: path.resolve(__dirname, 'user.html')
      }
    }
  }
});
