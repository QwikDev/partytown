import { callMethod } from './worker-proxy';
import { commaSplit } from './worker-constants';
import { type EventHandler, StateProp, type WorkerNode } from '../types';
import { getInstanceStateValue, setInstanceStateValue } from './worker-state';
import { noop } from '../utils';

export const HTMLSrcElementDescriptorMap: PropertyDescriptorMap & ThisType<WorkerNode> = {
  addEventListener: {
    value(...args: any[]) {
      const eventName = args[0];
      const callbacks = getInstanceStateValue<EventHandler[]>(this, eventName) || [];
      callbacks.push(args[1]);
      setInstanceStateValue(this, eventName, callbacks);
    },
  },
  async: {
    get: noop,
    set: noop,
  },
  defer: {
    get: noop,
    set: noop,
  },
  onload: {
    get() {
      let callbacks = getInstanceStateValue<EventHandler[]>(this, StateProp.loadHandlers);
      return (callbacks && callbacks[0]) || null;
    },
    set(cb) {
      setInstanceStateValue(this, StateProp.loadHandlers, cb ? [cb] : null);
    },
  },
  onerror: {
    get() {
      let callbacks = getInstanceStateValue<EventHandler[]>(this, StateProp.errorHandlers);
      return (callbacks && callbacks[0]) || null;
    },
    set(cb) {
      setInstanceStateValue(this, StateProp.errorHandlers, cb ? [cb] : null);
    },
  },

  getAttribute: {
    value(attrName: string) {
      if (attrName === 'src') {
        return (this as any).src;
      }
      return callMethod(this, ['getAttribute'], [attrName]);
    },
  },

  setAttribute: {
    value(attrName: string, attrValue: any) {
      if (scriptAttrPropNames.includes(attrName)) {
        (this as any)[attrName] = attrValue;
      } else {
        callMethod(this, ['setAttribute'], [attrName, attrValue]);
      }
    },
  },
};

const scriptAttrPropNames = commaSplit('src,type');
