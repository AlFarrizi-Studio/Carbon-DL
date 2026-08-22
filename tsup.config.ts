import {defineConfig} from 'tsup'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  entry: ['src/cli.tsx'],
  format: 'esm',
  target: 'node18',
  clean: true,
  splitting: false, // single-file output so installer only needs cli.js
  // Provide a real require() for bundled CJS deps (signal-exit etc.)
  banner: {
    js: [
      '#!/usr/bin/env node',
      'import {createRequire as __carbonCreateRequire} from "node:module";',
      'const require = __carbonCreateRequire(import.meta.url);',
    ].join('\n'),
  },
  // Bundle all JS deps so dist/cli.js is self-contained.
  noExternal: [/.*/],
  // sharp & ffmpeg-static stay external: they are native/optional and
  // loaded via dynamic import() with graceful fallbacks.
  external: ['sharp', 'ffmpeg-static'],
  esbuildOptions(options) {
    // react-devtools-core is an optional peer dep of ink (dev only).
    // Redirect it to an empty stub so the bundle resolves without it.
    options.alias = {
      ...options.alias,
      'react-devtools-core': path.join(__dirname, 'scripts', 'empty-devtools.js'),
    }
  },
})