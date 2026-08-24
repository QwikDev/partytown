import * as assert from 'uvu/assert';
import { serializeForWorker } from '../../src/lib/sandbox/main-serialization';
import { SerializedType } from '../../src/lib/types';
import { suite } from './utils';

const test = suite();

test('serializes underscore-prefixed members, excludes partytown internals', ({ win }) => {
  (globalThis as any).window = win;
  const serialized = serializeForWorker('w', { __key: 88, _pttab: 1, ok: 2 })!;
  assert.is(serialized[0], SerializedType.Object);
  const obj = serialized[1] as any;
  assert.equal(obj.__key, [SerializedType.Primitive, 88]);
  assert.equal(obj.ok, [SerializedType.Primitive, 2]);
  assert.is(obj._pttab, undefined);
});

test.run();
