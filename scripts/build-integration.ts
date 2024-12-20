import { type BuildOptions, submodulePackageJson } from './utils.js';
import { join } from 'node:path';
import type { OutputOptions, RollupOptions } from 'rollup';
import fsExtra from 'fs-extra';

const { readFile } = fsExtra;

export function buildIntegration(opts: BuildOptions): RollupOptions {
  const output: OutputOptions[] = [
    {
      file: join(opts.distIntegrationDir, 'index.cjs'),
      format: 'cjs',
    },
    {
      file: join(opts.distIntegrationDir, 'index.mjs'),
      format: 'es',
    },
    {
      file: join(opts.testsDir, 'integrations', 'load-scripts-on-main-thread', 'snippet.js'),
      format: 'umd',
      name: 'partytownIntegration',
    },
  ];

  return {
    input: join(opts.tscIntegrationDir, 'index.js'),
    output,
    plugins: [
      {
        name: 'snippet',
        resolveId(id) {
          if (id === '@snippet') {
            return id;
          }
        },
        async load(id) {
          if (id === '@snippet') {
            const codeFileName = 'partytown.js';

            let codeFilePath: string;
            if (opts.isDev) {
              codeFilePath = join(opts.distLibDebugDir, codeFileName);
            } else {
              codeFilePath = join(opts.distLibDir, codeFileName);
            }

            const code = JSON.stringify((await readFile(codeFilePath, 'utf-8')).trim());
            return `const PartytownSnippet = ${code}; export default PartytownSnippet;`;
          }
        },
      },
      submodulePackageJson(
        '@qwik.dev/partytown/integration',
        opts.srcIntegrationDir,
        opts.distIntegrationDir,
        opts
      ),
    ],
  };
}
