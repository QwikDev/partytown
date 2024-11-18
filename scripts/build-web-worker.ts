import { type OutputOptions, type Plugin, rollup } from 'rollup';
import {
  type BuildOptions,
  getJsBanner,
  type MessageType,
  onwarn,
  syncCommunicationModulesPlugin,
  versionPlugin,
} from './utils.js';
import { join } from 'node:path';
import fsExtra from 'fs-extra';
import { minifyPlugin } from './minify.js';

const { writeFile } = fsExtra;

export async function buildWebWorker(opts: BuildOptions, msgType: MessageType, debug: boolean) {
  const build = await rollup({
    input: join(opts.tscLibDir, 'web-worker', 'index.js'),
    plugins: [syncCommunicationModulesPlugin(opts, msgType), versionPlugin(opts)],
    onwarn,
  });

  const output: OutputOptions = {
    format: 'es',
    exports: 'none',
    intro: `((self)=>{`,
    outro: `})(self);`,
    plugins: [...minifyPlugin(opts, debug)],
  };

  const generated = await build.generate(output);

  const webWorkerCode = getJsBanner(opts, generated.output[0].code);
  if (debug) {
    const outName = `partytown-ww-${msgType}.js`;
    await writeFile(join(opts.distLibDebugDir, outName), webWorkerCode);
  }

  return webWorkerCode;
}

export function webWorkerBlobUrlPlugin(
  opts: BuildOptions,
  msgType: MessageType,
  debug: boolean
): Plugin {
  return {
    name: 'webWorkerBlobUrlPlugin',
    resolveId(id) {
      if (id.endsWith('web-worker-blob') || id.endsWith('web-worker-url')) {
        return id;
      }
      return null;
    },
    async load(id) {
      if (id.endsWith('web-worker-blob')) {
        let code = `""`;
        if (!opts.isDev) {
          code = JSON.stringify(await buildWebWorker(opts, msgType, debug));
        }
        return `const WEB_WORKER_BLOB = ${code}; export default WEB_WORKER_BLOB;`;
      }
      if (id.endsWith('web-worker-url')) {
        return `const WEB_WORKER_URL = "partytown-ww-${msgType}.js?v=${opts.packageJson.version}"; export default WEB_WORKER_URL;`;
      }
      return null;
    },
    async generateBundle() {
      if (opts.isDev) {
        const wwCode = await buildWebWorker(opts, msgType, debug);
        const wwDebugFilePath = join(opts.distLibDebugDir, `partytown-ww-${msgType}.js`);
        await writeFile(wwDebugFilePath, wwCode);
      }
    },
  };
}
