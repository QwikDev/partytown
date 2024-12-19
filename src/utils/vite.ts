import { libDirPath } from './copy-lib-files';
import type { PartytownRollupOptions } from './rollup';
import { partytownRollup } from './rollup';
import { join } from 'path';
import { readFile } from './fs';
import type { IncomingMessage, ServerResponse } from 'http';

/** @public */
export interface PartytownViteOptions extends PartytownRollupOptions {}

/**
 * The Vite plugin will copy Partytown `lib` directory to the given destination,
 * which must be an absolute file path. When in dev mode, the Partytown
 * lib files will be served using the Vite Dev Server.
 *
 * https://partytown.qwik.dev/copy-library-files
 *
 * @public
 */
export function partytownVite(opts: PartytownViteOptions) {
  opts = opts || ({} as any);

  const plugin: any = partytownRollup(opts);

  plugin.name = 'vite-plugin-partytown';

  plugin.configureServer = (server: any) => {
    if (server) {
      server.middlewares.use(
        async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          try {
            const url = req.url ?? '';
            // drop query
            const [pathname] = url.split('?');
            if (pathname.includes('partytown') && !pathname.includes('.vite')) {
              const fileName = pathname.split('/').pop();
              if (fileName && fileName.endsWith('.js')) {
                const libDir = libDirPath({ debugDir: pathname.includes('/debug/') });
                const filePath = join(libDir, fileName);
                const buf = await readFile(filePath);
                res.writeHead(200, {
                  'Content-Type': 'application/javascript; charset=utf-8',
                  'X-Vite-Dev-Sever-Partytown': ':tada:',
                });
                res.end(buf);
                return;
              }
            }
          } catch (e) {
            console.error(`partytownVite.configureServer`, e);
          }

          next();
        }
      );
    }
  };

  return plugin as {
    name: string;
  };
}
