import assert from 'node:assert/strict';
import path from 'node:path';
import { contentTypeFor, createStaticServer, resolveRequestPath } from './serve-public.mjs';

const root = path.resolve('public');

assert.equal(resolveRequestPath(root, '/../package.json'), null);
assert.equal(resolveRequestPath(root, '/%2e%2e/package.json'), null);
assert.equal(resolveRequestPath(root, '/..%5cpackage.json'), null);

const indexPath = resolveRequestPath(root, '/index.html');
assert.equal(path.relative(root, indexPath), 'index.html');
assert.equal(contentTypeFor(indexPath), 'text/html; charset=utf-8');
assert.equal(contentTypeFor(path.join(root, 'models', 'sample.glb')), 'model/gltf-binary');

const server = createStaticServer(root);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

try {
  const { port } = server.address();
  const ok = await fetch(`http://127.0.0.1:${port}/index.html`);
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('x-content-type-options'), 'nosniff');

  const traversal = await fetch(`http://127.0.0.1:${port}/%2e%2e/package.json`);
  assert.equal(traversal.status, 404);
} finally {
  await new Promise((resolve) => server.close(resolve));
}

console.log('Security server path tests passed.');
