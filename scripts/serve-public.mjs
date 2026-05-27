import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 4173;
const DEFAULT_ROOT = path.resolve('public');

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.glb', 'model/gltf-binary'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.wasm', 'application/wasm'],
  ['.webp', 'image/webp']
]);

export function parseArgs(argv) {
  const options = {
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    root: DEFAULT_ROOT
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--host') {
      options.host = argv[index + 1] || options.host;
      index += 1;
    } else if (arg === '--port') {
      const port = Number(argv[index + 1]);
      if (Number.isInteger(port) && port > 0 && port <= 65535) {
        options.port = port;
      }
      index += 1;
    } else if (arg === '--root') {
      options.root = path.resolve(argv[index + 1] || options.root);
      index += 1;
    }
  }

  return options;
}

export function resolveRequestPath(rootDir, requestUrl) {
  let pathname = String(requestUrl || '/');
  try {
    pathname = pathname
      .replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*(?=\/|$)/i, '')
      .split(/[?#]/, 1)[0] || '/';
    pathname = decodeURIComponent(pathname).replace(/\\/g, '/');
  } catch {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.some((segment) => segment === '..')) return null;

  const root = path.resolve(rootDir);
  const requested = path.resolve(root, ...segments);
  const relative = path.relative(root, requested);

  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return requested;
}

export async function fileForRequest(rootDir, requestUrl) {
  const requested = resolveRequestPath(rootDir, requestUrl);
  if (!requested) return null;

  const requestedStat = await stat(requested).catch(() => null);
  if (requestedStat?.isFile()) return requested;
  if (!requestedStat?.isDirectory()) return null;

  const indexPath = path.join(requested, 'index.html');
  const indexStat = await stat(indexPath).catch(() => null);
  return indexStat?.isFile() ? indexPath : null;
}

export function contentTypeFor(filePath) {
  return contentTypes.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';
}

export function createStaticServer(rootDir) {
  return createServer(async (request, response) => {
    const filePath = await fileForRequest(rootDir, request.url || '/');

    if (!filePath) {
      response.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      });
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': contentTypeFor(filePath),
      'X-Content-Type-Options': 'nosniff'
    });

    const stream = createReadStream(filePath);
    stream.on('error', () => {
      if (!response.headersSent) {
        response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      response.end('Internal server error');
    });
    stream.pipe(response);
  });
}

export function startServer(options = parseArgs(process.argv.slice(2))) {
  const server = createStaticServer(options.root);
  server.listen(options.port, options.host, () => {
    console.log(`Serving ${path.relative(process.cwd(), options.root) || '.'} at http://${options.host}:${options.port}/`);
  });
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
