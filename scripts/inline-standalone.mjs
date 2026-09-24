/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Inlines the standalone viewer build (dist-standalone/) into one HTML file that opens from disk.
 * An inline <script type="module"> needs no fetch, so it runs from file:// without a server.
 */

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist-standalone');
const outDir = path.join(root, 'standalone');
const outFile = path.join(outDir, 'MCR-3D-Component-Library.html');

let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const read = (ref) => fs.readFileSync(path.join(dist, ref.replace(/^\.\//, '')), 'utf8');
// Inline code must not close its own <script> / <style> element early.
const escapeScript = (s) => s.replace(/<\/script/gi, '<\\/script');
const escapeStyle = (s) => s.replace(/<\/style/gi, '<\\/style');

let scripts = 0;
let styles = 0;
html = html.replace(/<script\b([^>]*)\bsrc="([^"]+)"([^>]*)><\/script>/g, (_, pre, src, post) => {
  scripts++;
  const attrs = `${pre}${post}`.replace(/\s*crossorigin(="[^"]*")?/g, '');
  return `<script${attrs}>${escapeScript(read(src))}</script>`;
});
html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_, href) => {
  styles++;
  return `<style>${escapeStyle(read(href))}</style>`;
});

const leftovers = html.match(/(src|href)="\.?\/?assets\/[^"]+"/g);
if (scripts !== 1 || styles !== 1 || leftovers) {
  throw new Error(`Standalone inline failed: ${scripts} scripts, ${styles} styles, leftovers ${leftovers?.join(', ')}`);
}

// Same bytes on every platform: a Windows checkout (CRLF) must build the file CI (LF) builds.
html = html.replace(/\r+\n/g, '\n');

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, html);
fs.rmSync(dist, { recursive: true, force: true });
console.log(`Standalone viewer: ${path.relative(root, outFile)} (${(fs.statSync(outFile).size / 1024 / 1024).toFixed(2)} MB)`);
