import type { RollupOptions } from 'rollup';
import {
  type BuildOptions,
  fileSize,
  jsBannerPlugin,
  syncCommunicationModulesPlugin,
  versionPlugin,
  watchDir,
} from './utils.js';
import { join } from 'node:path';
import { minifyPlugin } from './minify.js';
import { webWorkerBlobUrlPlugin } from './build-web-worker.js';

export function buildAtomics(opts: BuildOptions): RollupOptions[] {
  const rollups: RollupOptions[] = [];

  rollups.push(buildAtomicsDebug(opts));
  if (!opts.isDev) {
    rollups.push(buildAtomicsMin(opts));
  }

  return rollups;
}

function buildAtomicsDebug(opts: BuildOptions): RollupOptions {
  return {
    input: join(opts.tscLibDir, 'sandbox', 'index.js'),
    output: {
      file: join(opts.distLibDebugDir, 'partytown-atomics.js'),
      format: 'es',
      exports: 'none',
      intro: `((window)=>{`,
      outro: `})(window);`,
      plugins: [versionPlugin(opts), ...minifyPlugin(opts, true)],
    },
    plugins: [
      versionPlugin(opts),
      syncCommunicationModulesPlugin(opts, 'atomics'),
      webWorkerBlobUrlPlugin(opts, 'atomics', true),
      watchDir(opts, join(opts.tscLibDir, 'atomics')),
      watchDir(opts, join(opts.tscLibDir, 'web-worker')),
      jsBannerPlugin(opts),
    ],
  };
}

function buildAtomicsMin(opts: BuildOptions): RollupOptions {
  return {
    input: join(opts.tscLibDir, 'sandbox', 'index.js'),
    output: {
      file: join(opts.distLibDir, 'partytown-atomics.js'),
      format: 'es',
      exports: 'none',
      intro: `((window)=>{`,
      outro: `})(window);`,
      plugins: [...minifyPlugin(opts, false), fileSize()],
    },
    plugins: [
      syncCommunicationModulesPlugin(opts, 'atomics'),
      webWorkerBlobUrlPlugin(opts, 'atomics', false),
      watchDir(opts, join(opts.tscLibDir, 'atomics')),
      watchDir(opts, join(opts.tscLibDir, 'web-worker')),
      versionPlugin(opts),
      jsBannerPlugin(opts),
    ],
  };
}
