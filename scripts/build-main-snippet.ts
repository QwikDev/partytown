import { type BuildOptions, fileSize, jsBannerPlugin, versionPlugin } from './utils.js';
import { join } from 'node:path';
import { minifyPlugin } from './minify.js';
import type { OutputOptions, Plugin, RollupOptions } from 'rollup';

export function buildMainSnippet(opts: BuildOptions): RollupOptions {
  const partytownDebug: OutputOptions = {
    file: join(opts.distLibDebugDir, 'partytown.js'),
    format: 'es',
    exports: 'none',
    plugins: [
      versionPlugin(opts),
      ...minifyPlugin(opts, true),
      {
        name: 'fallbackTimeout',
        generateBundle(opts, bundle) {
          for (const f in bundle) {
            const b = bundle[f];
            if (b.type === 'chunk') {
              b.code = b.code.replace(`"use strict";`, ``).trim();
            }
          }
        },
      },
    ],
  };

  const partytownMin: OutputOptions = {
    file: join(opts.distLibDir, 'partytown.js'),
    format: 'es',
    exports: 'none',
    plugins: [
      ...minifyPlugin(opts, false),
      {
        name: 'snippetClosure',
        generateBundle(_, bundle) {
          for (const f in bundle) {
            const b = bundle[f];
            if (b.type === 'chunk') {
              b.code = b.code.replace(`"use strict";`, ``).trim();
            }
          }
        },
      },
      versionPlugin(opts),
      fileSize(),
    ],
  };

  const output = [partytownDebug];
  if (!opts.isDev) {
    output.push(partytownMin);
  }

  return {
    input: join(opts.tscLibDir, 'main', 'snippet-entry.js'),
    output,
    plugins: [jsBannerPlugin(opts), fallbackTimeoutMsPlugin(opts)],
  };
}

function fallbackTimeoutMsPlugin(opts: BuildOptions): Plugin {
  // local build shouldn't run the fallback
  // a production build for release should set the fallback of 10 seconds
  const fallbackMs = opts.isReleaseBuild ? '1e4' /* 10000 */ : '999999999';
  return {
    name: 'fallbackTimeoutMsPlugin',
    async generateBundle(_, bundles) {
      for (const f in bundles) {
        const bundle = bundles[f];
        if (bundle.type === 'chunk') {
          bundle.code = bundle.code.replace('9999', fallbackMs);
        }
      }
    },
  };
}
