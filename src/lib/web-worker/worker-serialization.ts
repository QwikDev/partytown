import {
  type ApplyPath,
  CallType,
  type InstanceId,
  type RefHandlerCallbackData,
  type RefId,
  type SerializedAttr,
  type SerializedInstance,
  type SerializedObject,
  type SerializedRefTransferData,
  type SerializedTransfer,
  SerializedType,
  type WebWorkerEnvironment,
  type WinId,
  type WorkerNode,
} from '../types';
import { callMethod } from './worker-proxy';
import {
  environments,
  InstanceIdKey,
  postMessages,
  webWorkerRefIdsByRef,
  webWorkerRefsByRefId,
  WinIdKey,
} from './worker-constants';
import { defineConstructorName, getConstructorName, len, noop } from '../utils';
import { getOrCreateNodeInstance } from './worker-constructors';
import { setWorkerRef } from './worker-state';

export const serializeForMain = (
  $winId$: WinId,
  $instanceId$: InstanceId,
  value: any,
  added?: Set<any>,
  type?: string
): SerializedTransfer | undefined => {
  if (value !== undefined && (type = typeof value)) {
    if (type === 'string' || type === 'boolean' || type === 'number' || value == null) {
      return [SerializedType.Primitive, value];
    } else if (type === 'function') {
      return [
        SerializedType.Ref,
        {
          $winId$,
          $instanceId$,
          $refId$: setWorkerRef(value),
        },
      ];
    } else if ((added = added || new Set()) && Array.isArray(value)) {
      if (added.has(value)) {
        return [SerializedType.Array, []];
      } else {
        return (
          added.add(value) && [
            SerializedType.Array,
            value.map((v) => serializeForMain($winId$, $instanceId$, v, added)),
          ]
        );
      }
    } else if (type === 'object') {
      if (value[InstanceIdKey]) {
        return [SerializedType.Instance, [value[WinIdKey], value[InstanceIdKey]]];
      } else if (value instanceof Event) {
        return [
          SerializedType.Event,
          serializeObjectForMain($winId$, $instanceId$, value, false, added),
        ];
      } else if (supportsTrustedHTML && value instanceof TrustedHTML) {
        // https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API
        return [SerializedType.Primitive, value.toString()];
      } else if (value instanceof ArrayBuffer) {
        return [SerializedType.ArrayBuffer, value];
      } else if (ArrayBuffer.isView(value)) {
        return [SerializedType.ArrayBufferView, value.buffer, getConstructorName(value)];
      } else {
        return [
          SerializedType.Object,
          serializeObjectForMain($winId$, $instanceId$, value, true, added),
        ];
      }
    } else {
      return;
    }
  } else {
    return value;
  }
};

const supportsTrustedHTML = typeof TrustedHTML !== 'undefined';

const serializeObjectForMain = (
  winId: WinId,
  instanceId: RefId,
  obj: any,
  includeFunctions: boolean,
  added: Set<any>,
  serializedObj?: SerializedObject,
  propName?: string,
  propValue?: any
) => {
  serializedObj = {};
  if (!added.has(obj)) {
    added.add(obj);
    for (propName in obj) {
      propValue = obj[propName];
      if (includeFunctions || typeof propValue !== 'function') {
        serializedObj[propName] = serializeForMain(winId, instanceId, propValue, added);
      }
    }
  }
  return serializedObj;
};

export const serializeInstanceForMain = (
  instance: any,
  value: any
): SerializedTransfer | undefined =>
  instance
    ? serializeForMain(instance[WinIdKey], instance[InstanceIdKey], value)
    : [SerializedType.Primitive, value];

export const deserializeFromMain = (
  winId: WinId | undefined | null,
  instanceId: InstanceId | undefined | null,
  applyPath: ApplyPath,
  serializedValueTransfer?: SerializedTransfer,
  serializedType?: SerializedType,
  serializedValue?: any,
  obj?: any,
  key?: string
): any => {
  if (serializedValueTransfer) {
    serializedType = serializedValueTransfer[0];
    serializedValue = serializedValueTransfer[1] as any;

    if (
      serializedType === SerializedType.Primitive ||
      serializedType === SerializedType.CSSRule ||
      serializedType === SerializedType.CSSRuleList
    ) {
      return serializedValue;
    }

    if (serializedType === SerializedType.Ref) {
      return deserializeRefFromMain(applyPath, serializedValue);
    }

    if (serializedType === SerializedType.Function) {
      if (winId && applyPath.length > 0) {
        return (...args: any[]) =>
          callMethod(environments[winId].$window$, applyPath, args, CallType.Blocking);
      }

      return noop;
    }

    if (serializedType === SerializedType.Instance) {
      return getOrCreateSerializedInstance(serializedValue);
    }

    if (serializedType === SerializedType.NodeList) {
      return new NodeList(serializedValue.map(getOrCreateSerializedInstance));
    }

    if (serializedType === SerializedType.Attr) {
      return new Attr(serializedValue);
    }

    if (serializedType === SerializedType.Array) {
      return (serializedValue as SerializedTransfer[]).map((v) =>
        deserializeFromMain(winId, instanceId, applyPath, v)
      );
    }

    if (serializedType === SerializedType.Error) {
      return new CustomError(serializedValue);
    }

    obj = {};
    for (key in serializedValue) {
      obj[key] = deserializeFromMain(winId!, instanceId, [...applyPath, key], serializedValue[key]);
    }

    if (serializedType === SerializedType.CSSStyleDeclaration) {
      return new (environments[winId!].$window$ as any).CSSStyleDeclaration(
        winId!,
        instanceId!,
        applyPath,
        obj
      );
    }

    if (serializedType === SerializedType.Event) {
      if (obj.type === 'message' && obj.origin) {
        let postMessageKey = JSON.stringify(obj.data);
        let postMessageData = postMessages.find((pm) => pm.$data$ === postMessageKey);
        let env: WebWorkerEnvironment;
        if (postMessageData) {
          env = environments[postMessageData.$winId$];
          if (env) {
            obj.source = env.$window$;
            obj.origin = env.$location$.origin;
          }
        }
      }
      return new Proxy(new Event(obj.type, obj), {
        get: (target: any, propName) => {
          if (propName in obj) {
            return obj[propName];
          } else if (typeof target[String(propName)] === 'function') {
            return noop;
          } else {
            return target[String(propName)];
          }
        },
      });
    }

    if (serializedType === SerializedType.Object) {
      return obj;
    }
  }
};

export const getOrCreateSerializedInstance = ([
  winId,
  instanceId,
  nodeName,
  prevInstanceId,
]: SerializedInstance): any => {
  if (instanceId === winId && environments[winId]) {
    return environments[winId].$window$;
  } else {
    return getOrCreateNodeInstance(
      winId,
      instanceId,
      nodeName!,
      undefined,
      undefined,
      prevInstanceId
    );
  }
};

export const callWorkerRefHandler = ({
  $winId$,
  $instanceId$,
  $refId$,
  $thisArg$,
  $args$,
}: RefHandlerCallbackData) => {
  if (webWorkerRefsByRefId[$refId$]) {
    try {
      webWorkerRefsByRefId[$refId$].apply(
        deserializeFromMain($winId$, $instanceId$, [], $thisArg$),
        deserializeFromMain($winId$, $instanceId$, [], $args$)
      );
    } catch (e) {
      console.error(e);
    }
  }
};

const deserializeRefFromMain = (
  applyPath: ApplyPath,
  { $winId$, $instanceId$, $nodeName$, $refId$ }: SerializedRefTransferData
) => {
  if (!webWorkerRefsByRefId[$refId$]) {
    webWorkerRefIdsByRef.set(
      (webWorkerRefsByRefId[$refId$] = function (this: any, ...args: any[]) {
        const instance = getOrCreateNodeInstance($winId$, $instanceId$, $nodeName$!);
        return callMethod(instance, applyPath, args);
      }),
      $refId$
    );
  }

  return webWorkerRefsByRefId[$refId$];
};

class CustomError extends Error {
  constructor(errorObject: Error) {
    super(errorObject.message);
    this.name = errorObject.name;
    this.message = errorObject.message;
    this.stack = errorObject.stack;
  }
}

export class NodeList {
  private _: WorkerNode[];

  constructor(nodes: WorkerNode[]) {
    (this._ = nodes).map((node, index) => ((this as any)[index] = node));
  }
  entries() {
    return this._.entries();
  }
  forEach(cb: (value: Node, index: number) => void, thisArg?: any) {
    this._.map(cb, thisArg);
  }
  item(index: number) {
    return (this as any)[index];
  }
  keys() {
    return this._.keys();
  }
  get length() {
    return len(this._);
  }
  values() {
    return this._.values();
  }
  [Symbol.iterator]() {
    return this._[Symbol.iterator]();
  }
}

export const createNodeListCstr = (win: any) => {
  win.NodeList = defineConstructorName(NodeList, 'NodeList');
};

const Attr = class {
  name: string;
  value: string;

  constructor(serializedAttr: SerializedAttr) {
    this.name = serializedAttr[0];
    this.value = serializedAttr[1];
  }
  get nodeName() {
    return this.name;
  }
  get nodeType() {
    return 2;
  }
};

declare const TrustedHTML: any;
