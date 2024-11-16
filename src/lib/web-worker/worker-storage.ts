import { callMethod, getter } from './worker-proxy';
import { CallType, WebWorkerEnvironment } from '../types';
import { EMPTY_ARRAY } from '../utils';
import { warnCrossOrigin } from '../log';

export const addStorageApi = (
  win: any,
  storageName: 'localStorage' | 'sessionStorage',
  env: WebWorkerEnvironment
) => {
  let storage: Storage = {
    getItem(key) {
      if (env.$isSameOrigin$) {
        return callMethod(win, [storageName, 'getItem'], [key], CallType.Blocking);
      } else {
        warnCrossOrigin('get', storageName, env);
      }
    },

    setItem(key, value) {
      if (env.$isSameOrigin$) {
        callMethod(win, [storageName, 'setItem'], [key, value], CallType.Blocking);
      } else {
        warnCrossOrigin('set', storageName, env);
      }
    },

    removeItem(key) {
      if (env.$isSameOrigin$) {
        callMethod(win, [storageName, 'removeItem'], [key], CallType.Blocking);
      } else {
        warnCrossOrigin('remove', storageName, env);
      }
    },

    key(index) {
      if (env.$isSameOrigin$) {
        return callMethod(win, [storageName, 'key'], [index], CallType.Blocking);
      } else {
        warnCrossOrigin('key', storageName, env);
      }
    },

    clear() {
      if (env.$isSameOrigin$) {
        callMethod(win, [storageName, 'clear'], EMPTY_ARRAY, CallType.Blocking);
      } else {
        warnCrossOrigin('clear', storageName, env);
      }
    },

    get length() {
      if (env.$isSameOrigin$) {
        return getter(win, [storageName, 'length']);
      } else {
        warnCrossOrigin('length', storageName, env);
      }
    },
  };

  win[storageName] = new Proxy(storage, {
    get(target, key: string) {
      if (Reflect.has(target, key)) {
        return Reflect.get(target, key);
      } else {
        return target.getItem(key);
      }
    },
    set(target, key: string, value: string): boolean {
      target.setItem(key, value);
      return true;
    },
    has(target, key: PropertyKey | string): boolean {
      if (Reflect.has(target, key)) {
        return true;
      } else if (typeof key === 'string') {
        return target.getItem(key) !== null;
      } else {
        return false;
      }
    },
    deleteProperty(target, key: string): boolean {
      target.removeItem(key);
      return true;
    },
  });
};
