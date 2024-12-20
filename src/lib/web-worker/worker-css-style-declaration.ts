import {
  type ApplyPath,
  CallType,
  type InstanceId,
  type WinId,
  type WorkerConstructor,
} from '../types';
import { cachedDimensions, InstanceDataKey } from './worker-constants';
import { callMethod, getter, setter } from './worker-proxy';
import { defineConstructorName } from '../utils';
import { logDimensionCacheClearStyle } from '../log';

export const createCSSStyleDeclarationCstr = (
  win: any,
  WorkerBase: WorkerConstructor,
  cstrName: string
) => {
  win[cstrName] = defineConstructorName(
    class extends WorkerBase {
      constructor(winId: WinId, instanceId: InstanceId, applyPath: ApplyPath, styles: any) {
        super(winId, instanceId, applyPath, styles || {});

        return new Proxy(this, {
          get(target: any, propName) {
            if (target[propName]) {
              return target[propName];
            }
            if (
              !target[propName] &&
              typeof propName === 'string' &&
              !target[InstanceDataKey][propName]
            ) {
              target[InstanceDataKey][propName] = getter(target, [propName]);
            }
            return target[InstanceDataKey][propName];
          },
          set(target: any, propName, propValue) {
            target[InstanceDataKey][propName] = propValue;
            setter(target, [propName], propValue);
            logDimensionCacheClearStyle(target, propName);
            cachedDimensions.clear();
            return true;
          },
        });
      }
      setProperty(...args: string[]) {
        (this as any)[InstanceDataKey][args[0]] = args[1];
        callMethod(this, ['setProperty'], args, CallType.NonBlocking);
        logDimensionCacheClearStyle(this, args[0]);
        cachedDimensions.clear();
      }
      getPropertyValue(propName: string) {
        return (this as any)[propName];
      }
      removeProperty(propName: string) {
        let value = (this as any)[InstanceDataKey][propName];
        callMethod(this, ['removeProperty'], [propName], CallType.NonBlocking);
        logDimensionCacheClearStyle(this, propName);
        cachedDimensions.clear();
        (this as any)[InstanceDataKey][propName] = undefined;
        return value;
      }
    },
    cstrName
  );
};
