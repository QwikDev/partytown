import {
  ApplyPathKey,
  InstanceIdKey,
  WinIdKey,
  callMethod,
  setter,
  definePrototypePropertyDescriptor,
  randomId,
} from './bridge';
import { ContextKey, defineCstr, notImpl } from './utils';
import {
  CallType,
  type WorkerConstructor,
  type WorkerInstance,
  type WorkerWindow,
} from '../../types';

export const initCanvas = (WorkerBase: WorkerConstructor, win: WorkerWindow) => {
  const HTMLCanvasDescriptorMap: PropertyDescriptorMap & ThisType<Node> = {
    getContext: {
      value(this: any, contextType: string, contextAttributes: any) {
        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
        if (!this[ContextKey]) {
          this[ContextKey] = (contextType.includes('webgl') ? createContextWebGL : createContext2D)(
            this,
            contextType,
            contextAttributes
          );
        }
        return this[ContextKey];
      },
    },
  };

  const WorkerCanvasGradient = defineCstr(
    win,
    'CanvasGradient',
    class extends WorkerBase {
      addColorStop(...args: any[]) {
        callMethod(this, ['addColorStop'], args, CallType.NonBlocking);
      }
    }
  );

  const WorkerCanvasPattern = defineCstr(
    win,
    'CanvasPattern',
    class extends WorkerBase {
      setTransform(...args: any[]) {
        callMethod(this, ['setTransform'], args, CallType.NonBlocking);
      }
    }
  );

  const createContext2D = (
    canvasInstance: WorkerInstance,
    contextType: string,
    contextAttributes: any
  ) => {
    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D

    const winId: number = (canvasInstance as any)[WinIdKey];
    const ctxInstanceId = randomId();
    const ctxInstance = { [WinIdKey]: winId, [InstanceIdKey]: ctxInstanceId, [ApplyPathKey]: [] };

    const ctx = callMethod(
      canvasInstance,
      ['getContext'],
      [contextType, contextAttributes],
      CallType.Blocking,
      ctxInstanceId
    );

    const ctx2dGetterMethods =
      'getContextAttributes,getImageData,getLineDash,getTransform,isPointInPath,isPointInStroke,measureText'.split(
        ','
      );

    const CanvasRenderingContext2D = {
      get(target: any, propName: string | symbol) {
        if (typeof propName === 'string' && propName in ctx) {
          if (typeof ctx[propName] === 'function') {
            // context method
            return (...args: any[]) => {
              if (propName.startsWith('create')) {
                // createConicGradient,createImageData,createLinearGradient,createPattern,createRadialGradient
                // getter method, remember the instance

                const instanceId = randomId();
                callMethod(ctxInstance, [propName], args, CallType.NonBlocking, instanceId);

                if (propName === 'createImageData' || propName === 'createPattern') {
                  notImpl(`${propName}()`);
                  return { setTransform: () => {} };
                }

                // createConicGradient,createLinearGradient,createRadialGradient
                return new WorkerCanvasGradient(winId, instanceId);
              }

              // context method
              const methodCallType = ctx2dGetterMethods.includes(propName)
                ? CallType.Blocking
                : CallType.NonBlocking;

              return callMethod(ctxInstance, [propName], args, methodCallType);
            };
          }

          // context prop getter
          return ctx[propName];
        }

        // symbol prop getter
        return target[propName];
      },

      set(target: any, propName: string | symbol, value: any) {
        if (typeof propName === 'string' && propName in ctx) {
          // context prop setter
          if (ctx[propName] !== value && typeof value !== 'function') {
            setter(ctxInstance, [propName], value);
          }
          ctx[propName] = value;
        } else {
          target[propName] = value;
        }
        return true;
      },
    };

    return new Proxy(ctx, CanvasRenderingContext2D);
  };

  const createContextWebGL = (
    canvasInstance: WorkerInstance,
    contextType: string,
    contextAttributes: any
  ) => {
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext
    const winId: number = (canvasInstance as any)[WinIdKey];
    const ctxInstanceId = randomId();
    const ctxInstance = { [WinIdKey]: winId, [InstanceIdKey]: ctxInstanceId, [ApplyPathKey]: [] };

    const ctx = callMethod(
      canvasInstance,
      ['getContext'],
      [contextType, contextAttributes],
      CallType.Blocking,
      ctxInstanceId
    );

    const WebGLRenderingContextHandler = {
      get(target: any, propName: string | symbol) {
        if (typeof propName === 'string') {
          if (typeof ctx[propName] !== 'function') {
            // context prop getter
            return ctx[propName];
          }

          // context method
          return (...args: any[]) => {
            return callMethod(ctxInstance, [propName], args, getWebGlMethodCallType(propName));
          };
        }

        // symbol prop getter
        return target[propName];
      },

      set(target: any, propName: string | symbol, value: any) {
        if (typeof propName === 'string' && propName in ctx) {
          // context prop setter
          if (ctx[propName] !== value && typeof value !== 'function') {
            setter(ctxInstance, [propName], value);
          }
          ctx[propName] = value;
        } else {
          target[propName] = value;
        }
        return true;
      },
    };

    return new Proxy(ctx, WebGLRenderingContextHandler);
  };

  const ctxWebGLGetterMethods = 'checkFramebufferStatus,makeXRCompatible'.split(',');

  const getWebGlMethodCallType = (methodName: string) =>
    methodName.startsWith('create') ||
    methodName.startsWith('get') ||
    methodName.startsWith('is') ||
    ctxWebGLGetterMethods.includes(methodName)
      ? CallType.Blocking
      : CallType.NonBlocking;

  defineCstr(win, 'CanvasGradient', WorkerCanvasGradient);
  defineCstr(win, 'CanvasPattern', WorkerCanvasPattern);

  definePrototypePropertyDescriptor(win.HTMLCanvasElement, HTMLCanvasDescriptorMap);
};
