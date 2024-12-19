import { type BuildOptions, submodulePackageJson, submodulePath } from './utils.js';
import { join } from 'node:path';
import type { RollupOptions } from 'rollup';

export function buildReact(opts: BuildOptions): RollupOptions {
  return {
    input: join(opts.tscReactDir, 'index.js'),
    output: [
      {
        file: join(opts.distReactDir, 'index.cjs'),
        format: 'cjs',
      },
      {
        file: join(opts.distReactDir, 'index.mjs'),
        format: 'es',
      },
    ],
    external: ['react'],
    plugins: [
      submodulePath('@qwik.dev/partytown/integration', '../integration/index'),
      submodulePackageJson('@qwik.dev/partytown/react', opts.srcReactDir, opts.distReactDir, opts),
    ],
  };
}
