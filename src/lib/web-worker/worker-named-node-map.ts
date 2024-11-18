import {
  type ApplyPath,
  CallType,
  type InstanceId,
  type WinId,
  type WorkerConstructor,
  type WorkerInstance,
} from '../types';
import { defineConstructorName } from '../utils';
import { callMethod, getter, setter } from './worker-proxy';

export const createNamedNodeMapCstr = (win: any, WorkerBase: WorkerConstructor) => {
  const NamedNodeMap = class NamedNodeMap extends WorkerBase {
    constructor(winId: WinId, instanceId: InstanceId, applyPath: ApplyPath) {
      super(winId, instanceId, applyPath);
      return new Proxy(this, {
        get(target: any, propName): any {
          const handler = NAMED_NODE_MAP_HANDLERS[propName];
          if (handler) {
            return handler.bind(target, [propName]);
          } else {
            return getter(target, [propName]);
          }
        },
        set(target: any, propName, propValue): boolean {
          const handler = NAMED_NODE_MAP_HANDLERS[propName];
          if (handler) {
            throw new Error("Can't set read-only property: " + String(propName));
          } else {
            setter(target, [propName], propValue);
          }
          return true;
        },
      });
    }
  };

  win.NamedNodeMap = defineConstructorName(NamedNodeMap, 'NamedNodeMap');
};

function method(this: WorkerInstance, applyPath: ApplyPath, ...args: any[]) {
  return callMethod(this, applyPath, args, CallType.Blocking);
}

const NAMED_NODE_MAP_HANDLERS: Record<
  string | symbol,
  ((this: WorkerInstance, applyPath: ApplyPath, ...args: any[]) => void) | undefined
> = {
  getNamedItem: method,
  getNamedItemNS: method,
  item: method,
  removeNamedItem: method,
  removeNamedItemNS: method,
  setNamedItem: method,
  setNamedItemNS: method,
};
