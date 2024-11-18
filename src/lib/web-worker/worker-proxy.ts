import {
  type ApplyPath,
  ApplyPathType,
  type AssignInstanceId,
  type CallMethod,
  CallType,
  type ConstructGlobal,
  type Getter,
  type HookOptions,
  type MainAccessRequest,
  type MainAccessResponse,
  type MainAccessTask,
  type Setter,
  WorkerMessageType,
  type WorkerInstance,
  type WorkerNode,
} from '../types';
import {
  ApplyPathKey,
  cachedDimensions,
  cachedStructure,
  dimensionChangingMethodNames,
  dimensionChangingSetterNames,
  environments,
  HookContinue,
  HookPrevent,
  InstanceDataKey,
  InstanceIdKey,
  nonBlockingMethods,
  structureChangingMethodNames,
  webWorkerCtx,
  WinIdKey,
} from './worker-constants';
import { debug, getConstructorName, len, randomId } from '../utils';
import { deserializeFromMain, serializeInstanceForMain } from './worker-serialization';
import { hasInstanceStateValue, setInstanceStateValue } from './worker-state';
import {
  logCacheClearMethod,
  logDimensionCacheClearMethod,
  logDimensionCacheClearSetter,
  logWorker,
  logWorkerCall,
  logWorkerGetter,
  logWorkerGlobalConstructor,
  logWorkerSetter,
  taskDebugInfo,
} from '../log';
import syncSendMessageToMain from '../build-modules/sync-send-message-to-main';

const taskQueue: MainAccessTask[] = [];

const queue = (
  instance: WorkerInstance,
  $applyPath$: ApplyPath,
  callType: CallType,
  $assignInstanceId$?: AssignInstanceId,
  $groupedGetters$?: string[],
  buffer?: ArrayBuffer | ArrayBufferView
) => {
  if (!instance[ApplyPathKey]) {
    return;
  }
  taskQueue.push({
    $winId$: instance[WinIdKey],
    $instanceId$: instance[InstanceIdKey],
    $applyPath$: [...instance[ApplyPathKey], ...$applyPath$],
    $assignInstanceId$,
    $groupedGetters$,
  });
  if (debug) {
    taskQueue[len(taskQueue) - 1].$debug$ = taskDebugInfo(instance, $applyPath$, callType);

    if (buffer && callType !== CallType.NonBlockingNoSideEffect) {
      console.error('buffer must be sent NonBlockingNoSideEffect');
    }
  }

  if (callType === CallType.NonBlockingNoSideEffect) {
    // non-blocking and has no side effects (like an event)
    webWorkerCtx.$postMessage$(
      [
        WorkerMessageType.AsyncAccessRequest,
        {
          $msgId$: randomId(),
          $tasks$: [...taskQueue],
        },
      ],
      buffer ? [buffer instanceof ArrayBuffer ? buffer : buffer.buffer] : undefined
    );
    taskQueue.length = 0;
  } else if (callType === CallType.Blocking) {
    // this task is blocking, so let's send to the main and return the result
    return sendToMain(true);
  }

  // task is not blocking, so just update the async timer
  webWorkerCtx.$asyncMsgTimer$ = setTimeout(sendToMain, 20);
};

export const sendToMain = (isBlocking?: boolean) => {
  clearTimeout(webWorkerCtx.$asyncMsgTimer$);

  if (len(taskQueue)) {
    if (debug && webWorkerCtx.$config$.logMainAccess) {
      logWorker(`Main access, tasks sent: ${taskQueue.length}`);
    }

    const endTask = taskQueue[len(taskQueue) - 1];
    const accessReq: MainAccessRequest = {
      $msgId$: `${randomId()}.${webWorkerCtx.$tabId$}`,
      $tasks$: [...taskQueue],
    };
    taskQueue.length = 0;

    if (isBlocking) {
      // blocking call, returns response value from main
      const accessRsp: MainAccessResponse = syncSendMessageToMain(webWorkerCtx, accessReq);

      const isPromise = accessRsp.$isPromise$;

      const rtnValue = deserializeFromMain(
        endTask.$winId$,
        endTask.$instanceId$,
        endTask.$applyPath$,
        accessRsp.$rtnValue$!
      );

      if (accessRsp.$error$) {
        if (isPromise) {
          return Promise.reject(accessRsp.$error$);
        }
        throw new Error(accessRsp.$error$);
      }

      return isPromise ? Promise.resolve(rtnValue) : rtnValue;
    }

    // async call, fire and forget, returns undefined
    webWorkerCtx.$postMessage$([WorkerMessageType.AsyncAccessRequest, accessReq]);
  }
};

export const getter: Getter = (
  instance: WorkerInstance,
  applyPath: ApplyPath,
  groupedGetters?: string[],
  rtnValue?: any
) => {
  if (webWorkerCtx.$config$.get) {
    rtnValue = webWorkerCtx.$config$.get(createHookOptions(instance, applyPath));
    if (rtnValue !== HookContinue) {
      return rtnValue;
    }
  }

  rtnValue = queue(instance, applyPath, CallType.Blocking, undefined, groupedGetters);

  logWorkerGetter(instance, applyPath, rtnValue, false, !!groupedGetters);

  return rtnValue;
};

export const setter: Setter = (
  instance: WorkerInstance,
  applyPath: ApplyPath,
  value: any,
  hookSetterValue?: any
) => {
  if (webWorkerCtx.$config$.set) {
    hookSetterValue = webWorkerCtx.$config$.set({
      value,
      prevent: HookPrevent,
      ...createHookOptions(instance, applyPath),
    });
    if (hookSetterValue === HookPrevent) {
      return;
    }
    if (hookSetterValue !== HookContinue) {
      value = hookSetterValue;
    }
  }

  if (dimensionChangingSetterNames.some((s) => applyPath.includes(s))) {
    // style setter was called, let's clear the dimension cache
    cachedDimensions.clear();
    logDimensionCacheClearSetter(instance, applyPath[applyPath.length - 1]);
  }

  applyPath = [...applyPath, serializeInstanceForMain(instance, value), ApplyPathType.SetValue];

  logWorkerSetter(instance, applyPath, value);

  queue(instance, applyPath, CallType.NonBlocking);
};

export const callMethod: CallMethod = (
  instance: WorkerInstance,
  applyPath: ApplyPath,
  args: any[],
  callType?: CallType,
  assignInstanceId?: AssignInstanceId,
  buffer?: ArrayBuffer | ArrayBufferView,
  rtnValue?: any,
  methodName?: string
) => {
  if (webWorkerCtx.$config$.apply) {
    rtnValue = webWorkerCtx.$config$.apply({ args, ...createHookOptions(instance, applyPath) });
    if (rtnValue !== HookContinue) {
      return rtnValue;
    }
  }

  methodName = applyPath[len(applyPath) - 1];
  applyPath = [...applyPath, serializeInstanceForMain(instance, args)];

  callType =
    callType ||
    (nonBlockingMethods.includes(methodName!) ? CallType.NonBlocking : CallType.Blocking);

  if (methodName === 'setAttribute' && hasInstanceStateValue(instance, args[0])) {
    setInstanceStateValue(instance, args[0], args[1]);
  } else if (structureChangingMethodNames.includes(methodName!)) {
    cachedDimensions.clear();
    cachedStructure.clear();
    logCacheClearMethod(instance, methodName);
  } else if (dimensionChangingMethodNames.includes(methodName!)) {
    callType = CallType.NonBlocking;
    cachedDimensions.clear();
    logDimensionCacheClearMethod(instance, methodName);
  }

  rtnValue = queue(instance, applyPath, callType, assignInstanceId, undefined, buffer);

  logWorkerCall(instance, applyPath, args, rtnValue);

  return rtnValue;
};

export const constructGlobal: ConstructGlobal = (
  instance: WorkerInstance,
  cstrName: string,
  args: any[]
) => {
  logWorkerGlobalConstructor(instance, cstrName, args);

  queue(
    instance,
    [ApplyPathType.GlobalConstructor, cstrName, serializeInstanceForMain(instance, args)],
    CallType.Blocking
  );
};

const createHookOptions = (instance: WorkerInstance, applyPath: ApplyPath): HookOptions => ({
  name: applyPath.join('.'),
  continue: HookContinue,
  nodeName: (instance as any as WorkerNode)[InstanceDataKey],
  constructor: getConstructorName(instance),
  instance,
  window: environments[instance[WinIdKey]].$window$,
});
