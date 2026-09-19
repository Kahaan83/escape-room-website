/**
 * Bundles the whole mansion into a single self-contained dist/index.html.
 *
 *   npm install && npm run build
 *
 * The multi-file version under js/ is the one to read and edit. This output is
 * for dropping somewhere that can't serve ES modules — or opening straight off
 * the filesystem with a double-click.
 */

import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

const result = await build({
  entryPoints: [path.join(root, 'js/main.js')],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  write: false,
  legalComments: 'none',
});

const js = result.outputFiles[0].text;
const css = await fs.readFile(path.join(root, 'css/styles.css'), 'utf8');
let html = await fs.readFile(path.join(root, 'index.html'), 'utf8');

// NB: the function form of replace is deliberate. With a string replacement,
// `$$`, `$&` and `` $` `` are treated as substitution patterns, which quietly
// mangles the bundle (the $$ DOM helper collapses into $).
html = html
  .replace('<link rel="stylesheet" href="css/styles.css">', () => `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="js/main.js"></script>', () => `<script>\n${js}\n</script>`);

await fs.mkdir(path.join(root, 'dist'), { recursive: true });
await fs.writeFile(path.join(root, 'dist/index.html'), html);

const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log(`dist/index.html — ${kb} kB, no external files except the Google Fonts link.`);
