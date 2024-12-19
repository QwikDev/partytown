import { type BuildOptions, submodulePackageJson } from './utils.js';
import { join } from 'node:path';
import type { OutputOptions, RollupOptions } from 'rollup';

export function buildServices(opts: BuildOptions): RollupOptions {
  const output: OutputOptions[] = [
    {
      file: join(opts.distServicesDir, 'index.cjs'),
      format: 'cjs',
    },
    {
      file: join(opts.distServicesDir, 'index.mjs'),
      format: 'es',
    },
  ];

  return {
    input: join(opts.tscServicesDir, 'index.js'),
    output,
    plugins: [
      submodulePackageJson(
        '@qwik.dev/partytown/services',
        opts.srcServicesDir,
        opts.distServicesDir,
        opts
      ),
    ],
  };
}
