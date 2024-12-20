import gzipSize from 'gzip-size';
import { basename, join } from 'path';
import fsExtra from 'fs-extra';
import type { Plugin, RollupWarning } from 'rollup';

const { readdirSync, readFileSync, readJson, statSync, writeJson } = fsExtra;

export function syncCommunicationModulesPlugin(opts: BuildOptions, msgType: MessageType): Plugin {
  return {
    name: 'syncCommunicationModulesPlugin',
    resolveId(id) {
      if (id.endsWith('sync-send-message-to-main')) {
        if (msgType === 'sw') {
          return join(opts.tscLibDir, 'service-worker', `sync-send-message-to-main-sw.js`);
        }
        if (msgType === 'atomics') {
          return join(opts.tscLibDir, 'atomics', `sync-send-message-to-main-atomics.js`);
        }
      }
      if (id.endsWith('sync-create-messenger')) {
        if (msgType === 'sw') {
          return join(opts.tscLibDir, 'service-worker', `sync-create-messenger-sw.js`);
        }
        if (msgType === 'atomics') {
          return join(opts.tscLibDir, 'atomics', `sync-create-messenger-atomics.js`);
        }
      }
      return null;
    },
  };
}

export function fileSize(): Plugin {
  return {
    name: 'fileSize',
    writeBundle(options) {
      const filePath = options.file!;
      if (!filePath.includes('debug')) {
        const s = statSync(filePath);
        const gzip = gzipSize.sync(readFileSync(filePath, 'utf-8'));
        console.log(`🕺 ${basename(filePath)}: ${s.size} b`);
        console.log(`🎉 ${basename(filePath)}: ${gzip} b (gzip)`);
      }
    },
  };
}

export function submodulePath(moduleId: string, submodulePath: string): Plugin {
  return {
    name: 'resolveSubmodule',
    async resolveId(id) {
      if (id === moduleId) {
        return {
          external: true,
          id: submodulePath + '._MODULE_EXT_',
        };
      }
      return null;
    },
    generateBundle(opts, bundle) {
      const ext = opts.format === 'cjs' ? 'cjs' : 'mjs';
      for (const f in bundle) {
        const b = bundle[f];
        if (b.type === 'chunk') {
          b.code = b.code.replace(/_MODULE_EXT_/g, ext);
        }
      }
    },
  };
}

export function submodulePackageJson(
  submoduleName: string,
  submoduleSrcDir: string,
  submoduleBuildDir: string,
  opts: BuildOptions
): Plugin {
  return {
    name: 'submodulePackageJson',
    async writeBundle() {
      const pkg = await readJson(join(submoduleSrcDir, 'package.json'));
      pkg.name = submoduleName;
      pkg.version = opts.packageJson.version;
      pkg.private = true;
      await writeJson(join(submoduleBuildDir, 'package.json'), pkg, { spaces: 2 });
    },
  };
}

export function watchDir(opts: BuildOptions, dir: string): Plugin {
  return {
    name: 'watchDir',
    buildStart() {
      const addWatch = (p: string) => {
        const s = statSync(p);
        if (s.isDirectory()) {
          readdirSync(p).forEach((fileName) => addWatch(join(p, fileName)));
        } else if (s.isFile() && p.endsWith('.js')) {
          this.addWatchFile(p);
        }
      };
      if (opts.isDev) {
        addWatch(dir);
      }
    },
  };
}

export function onwarn(warning: RollupWarning) {
  if (warning.code === 'CIRCULAR_DEPENDENCY') return;
  console.log(warning.code);
}

export function getJsBanner(opts: BuildOptions, jsCode: string) {
  return `/* Partytown ${opts.packageJson.version} - MIT QwikDev */\n${jsCode}`;
}

export function jsBannerPlugin(opts: BuildOptions): Plugin {
  return {
    name: 'jsBanner',
    async generateBundle(_, bundles) {
      for (const f in bundles) {
        const bundle = bundles[f];
        if (bundle.type === 'chunk') {
          bundle.code = getJsBanner(opts, bundle.code);
        }
      }
    },
  };
}

export function versionPlugin(opts: BuildOptions): Plugin {
  return {
    name: 'versionPlugin',
    generateBundle(_, bundles) {
      for (const f in bundles) {
        const bundle = bundles[f];
        if (bundle.type === 'chunk') {
          bundle.code = bundle.code.replace(/_VERSION_/g, opts.packageJson.version);
        }
      }
    },
  };
}

export interface BuildOptions {
  isDev: boolean;
  isReleaseBuild: boolean;
  rootDir: string;
  distIntegrationDir: string;
  distLibDir: string;
  distLibDebugDir: string;
  distServicesDir: string;
  distReactDir: string;
  distUtilsDir: string;
  srcDir: string;
  srcIntegrationDir: string;
  srcServicesDir: string;
  srcLibDir: string;
  srcReactDir: string;
  srcUtilsDir: string;
  testsDir: string;
  testsVideosDir: string;
  tscDir: string;
  tscIntegrationDir: string;
  tscServicesDir: string;
  tscLibDir: string;
  tscReactDir: string;
  tscUtilsDir: string;
  packageJson: PackageJson;
}

export interface PackageJson {
  version: string;
}

export type MessageType = 'sw' | 'atomics';
