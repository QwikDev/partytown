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
