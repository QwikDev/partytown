import * as assert from 'uvu/assert';
import { createImageConstructor } from '../../src/lib/web-worker/worker-image';
import { suite } from './utils';

const test = suite();

test('HTMLImageElement constructor', ({ env }) => {
  const HTMLImageElement = createImageConstructor(env);
  const img = new HTMLImageElement();
  
  assert.is(img.src, '');
  assert.is(img.style instanceof Object, true);
  assert.is(img.attributes instanceof Map, true);
  assert.is(img.attributes.size, 0);
});

test('getAttribute/setAttribute', ({ env }) => {
  const HTMLImageElement = createImageConstructor(env);
  const img = new HTMLImageElement();
  
  assert.is(img.getAttribute('alt'), null);
  
  img.setAttribute('alt', 'test image');
  assert.is(img.getAttribute('alt'), 'test image');
  
  img.setAttribute('data-test', '123');
  assert.is(img.getAttribute('data-test'), '123');
  
  // Case insensitive
  img.setAttribute('ALT', 'uppercase');
  assert.is(img.getAttribute('alt'), 'uppercase');
  assert.is(img.getAttribute('ALT'), 'uppercase');
});

test('hasAttribute', ({ env }) => {
  const HTMLImageElement = createImageConstructor(env);
  const img = new HTMLImageElement();
  
  assert.is(img.hasAttribute('alt'), false);
  
  img.setAttribute('alt', 'test');
  assert.is(img.hasAttribute('alt'), true);
  assert.is(img.hasAttribute('ALT'), true); // Case insensitive
});

test('removeAttribute', ({ env }) => {
  const HTMLImageElement = createImageConstructor(env);
  const img = new HTMLImageElement();
  
  img.setAttribute('alt', 'test');
  img.setAttribute('data-test', '123');
  
  assert.is(img.hasAttribute('alt'), true);
  img.removeAttribute('alt');
  assert.is(img.hasAttribute('alt'), false);
  assert.is(img.getAttribute('alt'), null);
  
  // Other attributes unaffected
  assert.is(img.hasAttribute('data-test'), true);
});

test('toggleAttribute without force', ({ env }) => {
  const HTMLImageElement = createImageConstructor(env);
  const img = new HTMLImageElement();
  
  // Toggle on
  const result1 = img.toggleAttribute('hidden');
  assert.is(result1, true);
  assert.is(img.hasAttribute('hidden'), true);
  assert.is(img.getAttribute('hidden'), '');
  
  // Toggle off
  const result2 = img.toggleAttribute('hidden');
  assert.is(result2, false);
  assert.is(img.hasAttribute('hidden'), false);
});

test('toggleAttribute with force', ({ env }) => {
  const HTMLImageElement = createImageConstructor(env);
  const img = new HTMLImageElement();
  
  // Force on
  const result1 = img.toggleAttribute('hidden', true);
  assert.is(result1, true);
  assert.is(img.hasAttribute('hidden'), true);
  
  // Force on again (should stay on)
  const result2 = img.toggleAttribute('hidden', true);
  assert.is(result2, true);
  assert.is(img.hasAttribute('hidden'), true);
  
  // Force off
  const result3 = img.toggleAttribute('hidden', false);
  assert.is(result3, false);
  assert.is(img.hasAttribute('hidden'), false);
  
  // Force off again (should stay off)
  const result4 = img.toggleAttribute('hidden', false);
  assert.is(result4, false);
  assert.is(img.hasAttribute('hidden'), false);
});

test('addEventListener/removeEventListener for load', ({ env }) => {
  const HTMLImageElement = createImageConstructor(env);
  const img = new HTMLImageElement();
  
  const loadHandler = () => {};
  
  img.addEventListener('load', loadHandler);
  assert.is(img.l.length, 1);
  assert.is(img.l[0], loadHandler);
  
  img.removeEventListener('load', loadHandler);
  assert.is(img.l.length, 0);
});

test('addEventListener/removeEventListener for error', ({ env }) => {
  const HTMLImageElement = createImageConstructor(env);
  const img = new HTMLImageElement();
  
  const errorHandler = () => {};
  
  img.addEventListener('error', errorHandler);
  assert.is(img.e.length, 1);
  assert.is(img.e[0], errorHandler);
  
  img.removeEventListener('error', errorHandler);
  assert.is(img.e.length, 0);
});

test('onload getter/setter', ({ env }) => {
  const HTMLImageElement = createImageConstructor(env);
  const img = new HTMLImageElement();
  
  const handler = () => {};
  img.onload = handler;
  
  assert.is(img.onload, handler);
  assert.is(img.l.length, 1);
  assert.is(img.l[0], handler);
});

test('onerror getter/setter', ({ env }) => {
  const HTMLImageElement = createImageConstructor(env);
  const img = new HTMLImageElement();
  
  const handler = () => {};
  img.onerror = handler;
  
  assert.is(img.onerror, handler);
  assert.is(img.e.length, 1);
  assert.is(img.e[0], handler);
});

test('setAttribute with src attribute', ({ env }) => {
  const HTMLImageElement = createImageConstructor(env);
  const img = new HTMLImageElement();
  
  img.setAttribute('src', 'http://example.com/test.jpg');
  assert.is(img.getAttribute('src'), 'http://example.com/test.jpg');
  assert.is(img.src, 'http://example.com/test.jpg');
});

test.run();