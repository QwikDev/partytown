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

test('restores preserved behavior on fallback', ({ win, document, navigator, top }) => {
  const dataLayer: unknown[] = [];
  const event = { event: 'before-fallback' };
  let ready!: () => void;

  win.dataLayer = dataLayer;
  win.partytown = {
    forward: [['dataLayer.push', { preserveBehavior: true }]],
  };
  Object.defineProperty(document, 'readyState', { value: 'loading' });
  win.addEventListener = (_: string, callback: () => void) => (ready = callback);
  delete (navigator as any).serviceWorker;

  snippet(win, document, navigator, top, false);
  win.dataLayer.push(event);
  const queuedCalls = win._ptf.length;
  ready();

  assert.is(win.dataLayer, dataLayer);
  assert.equal(win.dataLayer, [event]);
  assert.is(win.dataLayer.push, Array.prototype.push);

  win.dataLayer.push({ event: 'after-fallback' });
  assert.is(win._ptf.length, queuedCalls);
});

test('restores mixed forwards sharing a root on fallback', ({ win, document, navigator, top }) => {
  const preserved = () => 'preserved';
  const forwarded = () => 'forwarded';
  const analytics = (win.analytics = { preserved, forwarded });
  let ready!: () => void;

  win.partytown = {
    forward: [['analytics.preserved', { preserveBehavior: true }], 'analytics.forwarded'],
  };
  Object.defineProperty(document, 'readyState', { value: 'loading' });
  win.addEventListener = (_: string, callback: () => void) => (ready = callback);
  delete (navigator as any).serviceWorker;

  snippet(win, document, navigator, top, false);
  ready();

  assert.is(win.analytics, analytics);
  assert.is(win.analytics.preserved, preserved);
  assert.is(win.analytics.forwarded, forwarded);
});

test.run();
