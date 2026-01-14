import { callMethod, getter } from './worker-proxy';
import { CallType, type WebWorkerEnvironment } from '../types';
import { EMPTY_ARRAY } from '../utils';
import { warnCrossOrigin } from '../log';

export const addStorageApi = (
  win: any,
  storageName: 'localStorage' | 'sessionStorage',
  env: WebWorkerEnvironment
) => {
  let storage: Storage = {
    getItem(key) {
      // Log Mixpanel localStorage operations with full value
      const isMixpanel = key?.includes('mp_') || key?.includes('mixpanel');
      if (env.$isSameOrigin$) {
        const value = callMethod(win, [storageName, 'getItem'], [key], CallType.Blocking);
        if (isMixpanel) {
          console.warn(`[PT-LS] 📖 ${storageName}.getItem('${key}') =`, value ? value.substring(0, 100) + '...' : 'NULL');
        }
        return value;
      } else {
        warnCrossOrigin('get', storageName, env);
      }
    },

    setItem(key, value) {
      const isMixpanel = key?.includes('mp_') || key?.includes('mixpanel');
      if (isMixpanel) {
        console.warn(`[PT-LS] ✏️ ${storageName}.setItem('${key}') =`, value?.substring?.(0, 100) + '...');
      }
      if (env.$isSameOrigin$) {
        callMethod(win, [storageName, 'setItem'], [key, value], CallType.Blocking);
      } else {
        warnCrossOrigin('set', storageName, env);
      }
    },

    removeItem(key) {
      const isMixpanel = key?.includes('mp_') || key?.includes('mixpanel');
      if (isMixpanel) {
        console.error(`[PT-LS] 🗑️ ${storageName}.removeItem('${key}') - BEING REMOVED!`);
      }
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
    get(target, key: PropertyKey) {
      // Handle Symbol keys (like Symbol.iterator, Symbol.toStringTag) - return undefined
      if (typeof key === 'symbol') {
        return undefined;
      }
      if (Reflect.has(target, key)) {
        return Reflect.get(target, key);
      } else {
        return target.getItem(key as string);
      }
    },
    set(target, key: PropertyKey, value: string): boolean {
      // Ignore Symbol keys
      if (typeof key === 'symbol') {
        return true;
      }
      target.setItem(key as string, value);
      return true;
    },
    has(target, key: PropertyKey): boolean {
      if (Reflect.has(target, key)) {
        return true;
      } else if (typeof key === 'string') {
        return target.getItem(key) !== null;
      } else {
        return false;
      }
    },
    deleteProperty(target, key: PropertyKey): boolean {
      if (typeof key === 'symbol') {
        return true;
      }
      target.removeItem(key as string);
      return true;
    },
  });
};
