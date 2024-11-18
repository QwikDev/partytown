import type { OutputOptions, RollupOptions } from 'rollup';
import { type BuildOptions, fileSize, jsBannerPlugin, versionPlugin, watchDir } from './utils.js';
import { join } from 'node:path';
import { minifyPlugin } from './minify.js';

export function buildMediaImplementation(opts: BuildOptions): RollupOptions {
  const debugOutput: OutputOptions = {
    file: join(opts.distLibDebugDir, `partytown-media.js`),
    format: 'es',
    exports: 'none',
    intro: `((self) => {`,
    outro: `})(self);`,
    plugins: [...minifyPlugin(opts, true), versionPlugin(opts), fileSize()],
  };

  const output: OutputOptions[] = [debugOutput];
  if (!opts.isDev) {
    output.push({
      file: join(opts.distLibDir, `partytown-media.js`),
      format: 'es',
      exports: 'none',
      intro: `((self) => {`,
      outro: `})(self);`,
      plugins: [...minifyPlugin(opts, false), versionPlugin(opts), fileSize()],
    });
  }

  return {
    input: join(opts.tscLibDir, 'web-worker', 'media', 'index.js'),
    output,
    plugins: [watchDir(opts, join(opts.tscLibDir, 'web-worker', 'media')), jsBannerPlugin(opts)],
  };
}
