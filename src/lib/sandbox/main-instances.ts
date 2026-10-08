import { CreatedKey, InstanceIdKey, instances, winCtxs, windowIds } from './main-constants';
import { type InstanceId, type MainWindowContext, WinDocId, type WinId } from '../types';
import { randomId } from '../utils';

export const getAndSetInstanceId = (instance: any, instanceId?: InstanceId) => {
  if (instance) {
    if ((instanceId = windowIds.get(instance))) {
      return instanceId;
    }
    if (!(instanceId = instance[InstanceIdKey])) {
      setInstanceId(instance, (instanceId = randomId()));
    }
    return instanceId;
  }
};

export const getInstance = <T = any>(
  winId: WinId,
  instanceId: InstanceId,
  win?: MainWindowContext,
  doc?: Document,
  docId?: string
): T | undefined => {
  if ((win = winCtxs[winId]) && win.$window$) {
    if (winId === instanceId) {
      return win.$window$ as any;
    }

    doc = win.$window$.document;
    docId = instanceId.split('.').pop();
    if (docId === WinDocId.document) {
      return doc as any;
    }
    if (docId === WinDocId.documentElement) {
      return doc.documentElement as any;
    }
    if (docId === WinDocId.head) {
      return doc.head as any;
    }
    if (docId === WinDocId.body) {
      return doc.body as any;
    }
  }

  return instances.get(instanceId);
};

export const setInstanceId = (instance: any, instanceId: InstanceId, now?: number) => {
  if (instance) {
    instances.set(instanceId, instance);
    instance[InstanceIdKey] = instanceId;
    instance[CreatedKey] = now = Date.now();

    if (now > lastCleanup + 5000) {
      instances.forEach((storedInstance: any, instanceId) => {
        if (storedInstance[CreatedKey] < lastCleanup) {
          if (storedInstance.nodeType && !storedInstance.isConnected) {
            instances.delete(instanceId);
          }
        }
      });
      lastCleanup = now;
    }
  }
};

let lastCleanup = 0;

// the page's iframe element whose window is `win`, e.g. the source of a message. The page is
// read here, not from main-globals: importing that reads `window` and breaks unit tests in Node
export const getPageFrame = (win: any) =>
  Array.from((window.parent as Window).document.querySelectorAll('iframe')).find(
    (frame) => frame.contentWindow === win
  );
