import * as assert from 'uvu/assert';
import { run, replaceThisInSource } from '../../src/lib/web-worker/worker-exec';
import { suite } from './utils';
const test = suite();

test('add window id to postMessage() when cross-origin', ({ env, win, winId }) => {
  env.$isSameOrigin$ = false;
  let result = false;
  win.parent.postMessage = function (postMessageWinId: string, msg: string) {
    result = postMessageWinId === winId && msg === '88';
  };
  const s = `
    parent.postMessage('88');
  `;
  run(env, s);
  assert.is(result, true);
});

test('do not add window id to postMessage() when same-origin', ({ env, win }) => {
  env.$isSameOrigin$ = true;
  let result = '';
  win.parent.postMessage = function (msg: string) {
    result = msg;
  };
  const s = `
    parent.postMessage('88');
  `;
  run(env, s);
  assert.is(result, '88');
});

test('Class this', ({ env, win }) => {
  const s = `
    class Cls {
      constructor() {
        window.result = this === window;
      }
    }
    new Cls();
  `;
  run(env, s);
  assert.is(win.result, false);
});

test('manually define global functions', ({ env, win, config }) => {
  config.globalFns = ['abc', 'xyz'];
  const s1 = `
    function abc() {
      return true;
    }
    function xyz() {
      return true;
    }
  `;
  const s2 = `
    window.result = window.abc() && window.xyz();
  `;
  run(env, s1);
  run(env, s2);
  assert.is(win.result, true);
});

test('manually define global functions in try/catch', ({ env, win, config }) => {
  config.globalFns = ['abc', 'xyz'];
  const s1 = `
    try {
      function abc() {
        return true;
      }
      function xyz() {
        return true;
      }
    } catch(err) {}
  `;
  const s2 = `
    window.result = window.abc() && window.xyz();
  `;
  run(env, s1);
  run(env, s2);
  assert.is(win.result, true);
});

test('this is window', ({ env, win }) => {
  const s = `window.result = this === window;`;
  run(env, s);
  assert.is(win.result, true);
});

test('window is window', ({ env, win }) => {
  const s = `window.result = window === window;`;
  run(env, s);
  assert.is(win.result, true);
});

test('We should replace `this` keyword more or less sane', ({ env, win }) => {
  const replaceSymbol = '__this';
  const r = function (code: string) {
    return replaceThisInSource(code, replaceSymbol);
  };

  // Should replace:
  assert.is(r('{this:123}'), '{this:123}');
  assert.is(
    r('console.log("I liked this product"); this.go();'),
    'console.log("I liked this product"); __this.go();'
  );
  assert.is(r('// skip this comment\nthis.go();'), '// skip this comment\n__this.go();');
  assert.is(r('/* and this one */ this.go();'), '/* and this one */ __this.go();');
  assert.is(r('`text ${fn({ a: this.b })} more this text`'), '`text ${fn({ a: __this.b })} more this text`');
  assert.is(r('a.this'), 'a.this');
  assert.is(r('[`kathis`]'), '[`kathis`]');
  assert.is(r('{ ...this.opts };'), '{ ...__this.opts };');
  assert.is(r('{ ...this.opts };this.lol;'), '{ ...__this.opts };__this.lol;');

  const input = `
    // Should replace:
    { ...this.opts };this.lol;
    this
    this.test
    log(this.variable)
    \`hello \${CONST} is \${this.CONST2}\`

    // Should not replace:
    ['this', "this", \`this\`]
    {this:123}
    { this: 123 }
    'sadly we fail at this simple string'
    "same as this"
    \`and this is \${false} too\`;
    a.b.this
    let _this, This, $this
  `;
  const rez = replaceThisInSource(input, `__this`);

  const out = `
    // Should replace:
    { ...__this.opts };__this.lol;
    __this
    __this.test
    log(__this.variable)
    \`hello \${CONST} is \${__this.CONST2}\`

    // Should not replace:
    ['this', "this", \`this\`]
    {this:123}
    { this: 123 }
    'sadly we fail at this simple string'
    "same as this"
    \`and this is \${false} too\`;
    a.b.this
    let _this, This, $this
  `;

  assert.is(rez, out);
});

test('properly replaces this is js window context', ({ env, win }) => {
  const s = `
    let a = { this: 123 };
    window.result = a.this;
  `;
  run(env, s);
  assert.is(win.result, 123);
});

test.run();
