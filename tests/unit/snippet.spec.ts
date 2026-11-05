import * as assert from 'uvu/assert';
import { snippet } from '../../src/lib/main/snippet';
import { suite } from './utils';

const test = suite();

test('service worker url config', ({ win, document, navigator, top }) => {
  win.partytown = {
    swPath: 'partytown-sw.js?mph=88',
  };

  const script = document.createElement('script');
  script.type = 'text/partytown';
  document.body.appendChild(script);

  snippet(win, document, navigator, top, false);

  assert.equal(navigator.$serviceWorkerUrl, '/~partytown/partytown-sw.js?mph=88');
  assert.equal(navigator.$serviceWorkerOptions, { scope: '/~partytown/' });
});

test('service worker iframe, lib and debug config', ({ win, document, navigator, top }) => {
  win.partytown = {
    lib: '/my-custom-location/',
    debug: true,
  };

  const script = document.createElement('script');
  script.type = 'text/partytown';
  document.body.appendChild(script);

  snippet(win, document, navigator, top, false);

  assert.equal(navigator.$serviceWorkerUrl, '/my-custom-location/debug/partytown-sw.js');
  assert.equal(navigator.$serviceWorkerOptions, { scope: '/my-custom-location/debug/' });

  const iframe = document.body.querySelector('iframe')!;
  const iframeUrl = new URL(iframe.src, 'http://builder.io/');
  assert.equal(iframeUrl.pathname, '/my-custom-location/debug/partytown-sandbox-sw.html');
});

test('service worker iframe, defaults', ({ win, document, navigator, top }) => {
  const script = document.createElement('script');
  script.type = 'text/partytown';
  document.body.appendChild(script);

  snippet(win, document, navigator, top, false);

  assert.equal(navigator.$serviceWorkerUrl, '/~partytown/partytown-sw.js');
  assert.equal(navigator.$serviceWorkerOptions, { scope: '/~partytown/' });

  const iframe = document.body.querySelector('iframe')!;
  const iframeUrl = new URL(iframe.src, 'http://builder.io/');
  assert.equal(iframeUrl.pathname, '/~partytown/partytown-sandbox-sw.html');
  assert.not.equal(iframeUrl.search, '');
});

test('forward replays items already in an existing array', ({ win, document, navigator, top }) => {
  win.partytown = {
    forward: ['dataLayer.push'],
  };
  win.dataLayer = [{ event: 'early' }];

  snippet(win, document, navigator, top, false);

  assert.equal(win._ptf.length, 2);
  assert.equal(win._ptf[0], ['dataLayer', 'push']);
  assert.equal(win._ptf[1], [{ event: 'early' }]);

  win.dataLayer.push({ event: 'later' });
  assert.equal(win._ptf.length, 4);
  assert.equal(win._ptf[3][0], { event: 'later' });
});

test('fallback keeps the src of external scripts', ({ win, document, navigator, top }) => {
  const inlineScript = document.createElement('script');
  inlineScript.type = 'text/partytown';
  inlineScript.innerHTML = 'console.log(88)';
  document.body.appendChild(inlineScript);

  const externalScript = document.createElement('script');
  externalScript.type = 'text/partytown';
  externalScript.src = 'http://builder.io/analytics.js';
  document.body.appendChild(externalScript);

  // no service worker support triggers the fallback
  delete (navigator as any).serviceWorker;
  snippet(win, document, navigator, top, false);

  const fallbackScripts = document.head.querySelectorAll('script');
  assert.is(fallbackScripts.length, 2);
  assert.is(fallbackScripts[0].innerHTML, 'console.log(88)');
  assert.is(fallbackScripts[1].src, 'http://builder.io/analytics.js');
});

test('fallback skips worker only scripts', ({ win, document, navigator, top }) => {
  const script = document.createElement('script');
  script.type = 'text/partytown';
  script.innerHTML = 'console.log(88)';
  document.body.appendChild(script);

  const workerOnlyScript = document.createElement('script');
  workerOnlyScript.type = 'text/partytown';
  workerOnlyScript.setAttribute('data-ptworkeronly', '');
  workerOnlyScript.innerHTML = 'window.global = document';
  document.body.appendChild(workerOnlyScript);

  const workerOnlyExternalScript = document.createElement('script');
  workerOnlyExternalScript.type = 'text/partytown';
  workerOnlyExternalScript.setAttribute('data-ptworkeronly', '');
  workerOnlyExternalScript.src = 'http://builder.io/worker-setup.js';
  document.body.appendChild(workerOnlyExternalScript);

  // no service worker support triggers the fallback
  delete (navigator as any).serviceWorker;
  snippet(win, document, navigator, top, false);

  const fallbackScripts = document.head.querySelectorAll('script');
  assert.is(fallbackScripts.length, 1);
  assert.is(fallbackScripts[0].innerHTML, 'console.log(88)');
  assert.is(workerOnlyScript.type, 'text/partytown');
  assert.is(workerOnlyExternalScript.type, 'text/partytown');
});

test('fallback when service worker registration fulfills without a registration', ({
  win,
  document,
  navigator,
  top,
}) => {
  const script = document.createElement('script');
  script.type = 'text/partytown';
  script.innerHTML = 'console.log(88)';
  document.body.appendChild(script);

  // e.g. Playwright with serviceWorkers: 'block' fulfills register() with undefined
  (navigator as any).serviceWorker.register = () => ({
    then(onFulfilled: any) {
      onFulfilled(undefined);
    },
  });
  snippet(win, document, navigator, top, false);

  const fallbackScripts = document.head.querySelectorAll('script');
  assert.is(fallbackScripts.length, 1);
  assert.is(fallbackScripts[0].innerHTML, 'console.log(88)');
});

test('fallback keeps objects forwarded with preserveBehavior', ({
  win,
  document,
  navigator,
  top,
}) => {
  win.partytown = {
    forward: [
      ['dataLayer.push', { preserveBehavior: true }],
      'dataLayer.other',
      'ga',
      // a top level stub is still removed so its script can set it up again
      ['fbq', { preserveBehavior: true }],
    ],
  };

  let fulfillRegister: any;
  (navigator as any).serviceWorker.register = () => ({
    then(onFulfilled: any) {
      fulfillRegister = onFulfilled;
    },
  });
  snippet(win, document, navigator, top, false);

  win.dataLayer.push({ event: 'before fallback' });
  fulfillRegister(undefined);

  assert.equal(win.dataLayer.slice(), [{ event: 'before fallback' }]);
  assert.not.ok('ga' in win);
  assert.not.ok('fbq' in win);
});

test('iframe with a cross-origin top runs its own partytown', ({ win, document, navigator }) => {
  const script = document.createElement('script');
  script.type = 'text/partytown';
  document.body.appendChild(script);

  const crossOriginTop: any = {};
  Object.defineProperty(crossOriginTop, 'dispatchEvent', {
    get() {
      throw new Error('cross-origin');
    },
  });

  snippet(win, document, navigator, crossOriginTop, false);

  assert.equal(navigator.$serviceWorkerUrl, '/~partytown/partytown-sw.js');
});

test.run();
