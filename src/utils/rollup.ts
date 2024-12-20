import { isAbsolute, join } from 'node:path';
import type { Plugin } from 'rollup';
import { copyLibFiles } from './copy-lib-files';

/** @public */
export interface PartytownRollupOptions {
  /** An absolute path to the destination directory where the lib files should be copied. */
  dest?: string;

  /**
   * When `debug` is set to `false`, the `lib/debug` directory will not be copied.
   * The default is that both the production and debug directories are copied to the destination.
   */
  debug?: boolean;
}

/**
 * The Rollup plugin will copy Partytown `lib` directory to the given destination,
 * which must be an absolute file path.
 *
 * https://partytown.qwik.dev/copy-library-files
 *
 * @public
 */
export function partytownRollup(opts?: PartytownRollupOptions) {
  opts = opts || ({} as any);

  const plugin: Plugin = {
    name: 'rollup-plugin-partytown',
    async writeBundle(rollupOpts) {
      const dir = opts?.dest || (rollupOpts.dir ? join(rollupOpts.dir, '~partytown') : undefined);

      if (typeof dir !== 'string') {
        throw new Error(
          `A destination directory must be specified either via the Partytown "dest" option or Rollup output dir option.`
        );
      }

      if (!isAbsolute(dir)) {
        throw new Error(`Partytown plugin "dest" property must be an absolute path.`);
      }

      await copyLibFiles(dir, { debugDir: opts?.debug });
    },
  };

  return plugin as { name: string };
}
