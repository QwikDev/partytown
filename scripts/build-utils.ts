import { type BuildOptions, submodulePackageJson } from './utils.js';
import { join } from 'node:path';
import type { RollupOptions } from 'rollup';

export function buildUtils(opts: BuildOptions): RollupOptions {
  return {
    input: join(opts.tscUtilsDir, 'index.js'),
    output: [
      {
        file: join(opts.distUtilsDir, 'index.cjs'),
        format: 'cjs',
      },
      {
        file: join(opts.distUtilsDir, 'index.mjs'),
        format: 'es',
      },
    ],
    external: ['fs', 'path', 'url', 'util'],
    plugins: [
      submodulePackageJson('@qwik.dev/partytown/utils', opts.srcUtilsDir, opts.distUtilsDir, opts),
    ],
  };
}
