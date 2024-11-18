import terser, { type Options } from '@rollup/plugin-terser';
import type { Plugin } from 'rollup';
import type { BuildOptions } from './utils';

export function minifyPlugin(opts: BuildOptions, debug: boolean) {
  if (debug) {
    return [terser(minifyOptions(opts, true))];
  }
  return [managlePropsPlugin(), terser(minifyOptions(opts, false))];
}

function minifyOptions(opts: BuildOptions, debug: boolean): Options {
  if (debug) {
    const moreCompression = !opts.isDev;
    return {
      compress: {
        global_defs: {
          'globalThis.partytownDebug': true,
        },
        booleans: false,
        collapse_vars: false,
        conditionals: moreCompression,
        evaluate: moreCompression,
        if_return: moreCompression,
        inline: false,
        join_vars: false,
        keep_classnames: true,
        loops: false,
        sequences: false,
        passes: 1,
        drop_debugger: moreCompression,
      },
      format: {
        comments: false,
        beautify: true,
        braces: true,
      },
      mangle: false,
    };
  }

  return {
    compress: {
      global_defs: {
        'globalThis.partytownDebug': false,
      },
      ecma: 2018,
      passes: 3,
      unsafe_symbols: true,
    },
    format: {
      comments: false,
      ecma: 2018,
    },
  };
}

function managlePropsPlugin(): Plugin {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_'.split('');
  const mangleProps: { [key: string]: string } = {
    $applyPath$: '',
    $args$: '',
    $asyncMsgTimer$: '',
    $assignInstanceId$: '',
    $body$: '',
    $bridgeFromMedia$: '',
    $bridgeToMedia$: '',
    $buf$: '',
    $config$: '',
    $content$: '',
    $createNode$: '',
    $currentScriptId$: '',
    $data$: '',
    $document$: '',
    $documentElement$: '',
    $error$: '',
    $forward$: '',
    $groupedGetters$: '',
    $head$: '',
    $importScripts$: '',
    $initWindowMedia$: '',
    $interfaces$: '',
    $instanceId$: '',
    $isInitialized$: '',
    $isLoading$: '',
    $isPromise$: '',
    $isSameOrigin$: '',
    $isTopWindow$: '',
    $libPath$: '',
    $localStorage$: '',
    $location$: '',
    $msgId$: '',
    $nodeName$: '',
    $orgUrl$: '',
    $origin$: '',
    $parentWinId$: '',
    $postMessage$: '',
    $refId$: '',
    $rtnValue$: '',
    $runWindowLoadEvent$: '',
    $sessionStorage$: '',
    $sharedDataBuffer$: '',
    $tasks$: '',
    $thisArg$: '',
    $url$: '',
    $visibilityState$: '',
    $window$: '',
    $winId$: '',
  };

  if (chars.length < Object.keys(mangleProps).length) {
    throw new Error('Figure out a better property renaming plan');
  }

  Object.keys(mangleProps).forEach((key, i) => {
    mangleProps[key] = chars[i];
  });

  return {
    name: 'mangleProps',
    generateBundle(_opts, bundle) {
      for (const fileName in bundle) {
        const b = bundle[fileName];
        if (b.type === 'chunk') {
          Object.keys(mangleProps).forEach((key) => {
            const rg = new RegExp(key.replace(/\$/g, '\\$'), 'g');
            const replaceWith = mangleProps[key];
            b.code = b.code.replace(rg, replaceWith);
          });
        }
      }
    },
  };
}
