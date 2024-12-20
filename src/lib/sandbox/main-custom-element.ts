import {
  type CustomElementData,
  type PartytownWebWorker,
  type WinId,
  WorkerMessageType,
} from '../types';
import { defineConstructorName } from '../utils';
import { getAndSetInstanceId } from './main-instances';
import { winCtxs } from './main-constants';

export const defineCustomElement = (
  winId: WinId,
  worker: PartytownWebWorker,
  ceData: CustomElementData
) => {
  const Cstr = defineConstructorName(
    class extends (winCtxs[winId]!.$window$ as any).HTMLElement {},
    ceData[0]
  );

  const ceCallbackMethods =
    'connectedCallback,disconnectedCallback,attributeChangedCallback,adoptedCallback'.split(',');

  ceCallbackMethods.map(
    (callbackMethodName) =>
      (Cstr.prototype[callbackMethodName] = function (...args: any) {
        worker.postMessage([
          WorkerMessageType.CustomElementCallback,
          winId,
          getAndSetInstanceId(this)!,
          callbackMethodName,
          args,
        ]);
      })
  );

  Cstr.observedAttributes = ceData[1];

  return Cstr;
};
