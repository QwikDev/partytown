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

test.run();
