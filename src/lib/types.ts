export type CreateWorker = (workerName: string) => Worker;

export type Messenger = (
  receiveMessage: MessengerRequestCallback
) => Promise<MessengerHandler | null>;

export type MessengerRequestCallback = (
  accessReq: MainAccessRequest,
  responseCallback: MessengerResponseCallback
) => void;

export type MessengerHandler = (
  worker: PartytownWebWorker,
  msg: MessageFromWorkerToSandbox
) => void;

export type MessengerResponseCallback = (accessRsp: MainAccessResponse) => void;

export type WinId = string;

export type InstanceId = string;

export type RefId = string;

export interface AssignWinInstanceId {
  $winId$: WinId;
}

export type AssignInstanceId = InstanceId | AssignWinInstanceId;

export type MessageFromWorkerToSandbox =
  | [type: WorkerMessageType.MainDataRequestFromWorker]
  | [type: WorkerMessageType.MainInterfacesRequestFromWorker]
  | [type: WorkerMessageType.InitializedWebWorker]
  | [
      type: WorkerMessageType.InitializedEnvironmentScript,
      winid: WinId,
      instanceId: InstanceId,
      errorMsg: string
    ]
  | [type: WorkerMessageType.InitializeNextScript, winId: WinId]
  | [type: WorkerMessageType.ForwardWorkerAccessRequest, accessReq: MainAccessRequest]
  | [type: WorkerMessageType.AsyncAccessRequest, accessReq: MainAccessRequest];

export type MessageFromSandboxToWorker =
  | [type: WorkerMessageType.MainDataResponseToWorker, initWebWorkerData: InitWebWorkerData]
  | [type: WorkerMessageType.MainInterfacesResponseToWorker, interfaces: InterfaceInfo[]]
  | [type: WorkerMessageType.InitializeEnvironment, initEnvData: InitializeEnvironmentData]
  | [type: WorkerMessageType.InitializeNextScript, initScriptData: InitializeScriptData]
  | [type: WorkerMessageType.InitializedScripts, winId: WinId]
  | [type: WorkerMessageType.RefHandlerCallback, callbackData: RefHandlerCallbackData]
  | [type: WorkerMessageType.ForwardMainTrigger, triggerData: ForwardMainTriggerData]
  | [type: WorkerMessageType.LocationUpdate, locationChangeData: LocationUpdateData]
  | [type: WorkerMessageType.DocumentVisibilityState, winId: WinId, visibilityState: string]
  | [
      type: WorkerMessageType.CustomElementCallback,
      winId: WinId,
      instanceId: InstanceId,
      callbackName: string,
      args: any[]
    ];

export const enum WorkerMessageType {
  MainDataRequestFromWorker,
  MainDataResponseToWorker,
  MainInterfacesRequestFromWorker,
  MainInterfacesResponseToWorker,
  InitializedWebWorker,
  InitializeEnvironment,
  InitializedEnvironmentScript,
  InitializeNextScript,
  InitializedScripts,
  RefHandlerCallback,
  ForwardMainTrigger,
  ForwardWorkerAccessRequest,
  AsyncAccessRequest,
  LocationUpdate,
  DocumentVisibilityState,
  CustomElementCallback,
}

export const enum LocationUpdateType {
  PushState,
  ReplaceState,
  PopState,
  HashChange,
}

export interface LocationUpdateData {
  $winId$: WinId;
  type: LocationUpdateType;
  state: object;
  url: string;
  newUrl?: string;
  oldUrl?: string;
}

export interface ForwardMainTriggerData {
  $winId$: WinId;
  $forward$: string[];
  $args$: SerializedTransfer | undefined;
}

export interface RefHandlerCallbackData {
  $winId$: WinId;
  $instanceId$: InstanceId;
  $refId$: RefId;
  $thisArg$: SerializedTransfer | undefined;
  $args$: SerializedTransfer | undefined;
}

export type PostMessageToWorker = (msg: MessageFromSandboxToWorker) => void;

export interface MainWindowContext {
  $winId$: WinId;
  $isInitialized$?: number;
  $startTime$?: number;
  $window$: MainWindow;
}

export interface PartytownWebWorker extends Worker {
  postMessage: PostMessageToWorker;
}

export interface InitWebWorkerData {
  $config$: string;
  $interfaces$: InterfaceInfo[];
  $libPath$: string;
  $sharedDataBuffer$?: SharedArrayBuffer;
  $origin$: string;
  $tabId$?: number;
}

/**
 * [0] Constructor name
 * [1] Prototype parent constructor name
 * [2] InterfaceMember[]
 * [3]? InterfaceType
 * [4]? Node Name
 */
export type InterfaceInfo =
  | [string, string, InterfaceMember[], InterfaceType, string]
  | [string, string, InterfaceMember[], InterfaceType]
  | [string, string, InterfaceMember[]];

/**
 * [0] Member name
 * [1] Constructor name or interface type
 * [2]? If there's a value it's a static prop
 */
export type InterfaceMember =
  | [string, string]
  | [string, InterfaceType.Function]
  | [string, InterfaceType.Property]
  | [string, InterfaceType.Property, string | number | boolean];

export interface WebWorkerContext {
  $asyncMsgTimer$?: any;
  $config$: PartytownInternalConfig;
  $importScripts$: (...urls: string[]) => void;
  $initWindowMedia$?: InitWindowMedia;
  $interfaces$: InterfaceInfo[];
  $indexedDB$: any;
  $isInitialized$?: number;
  $libPath$: string;
  $origin$: string;
  $postMessage$: (msg: MessageFromWorkerToSandbox, arr?: any[]) => void;
  $sharedDataBuffer$?: SharedArrayBuffer;
  lastLog?: string;
  $tabId$?: number;
}

export interface InitializeEnvironmentData {
  $winId$: WinId;
  $parentWinId$: WinId;
  $url$: string;
  $visibilityState$?: string;
}

export interface WebWorkerEnvironment {
  $winId$: WinId;
  $parentWinId$: WinId;
  $window$: Window;
  $document$: Document;
  $documentElement$: HTMLElement;
  $head$: HTMLElement;
  $body$: HTMLElement;
  $location$: Location;
  $visibilityState$?: string;
  $createNode$: (
    nodeName: string,
    instanceId: InstanceId,
    namespace?: string,
    prevInstance?: WorkerNode
  ) => WorkerNode;
  $currentScriptId$?: InstanceId;
  $isInitialized$?: number;
  $isLoading$?: number;
  $runWindowLoadEvent$?: number;
  $isSameOrigin$?: boolean;
  $isTopWindow$?: boolean;
  $propagateHistoryChange$?: boolean;
}

export interface MembersInterfaceTypeInfo {
  [memberName: string]: InterfaceType;
}

export const enum InterfaceType {
  // NodeType 0 not used, so using for Window interface
  Window = 0,

  // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
  Element = 1,
  AttributeNode = 2,
  TextNode = 3,
  CDataSectionNode = 4,

  // NodeType 5 and 6 not used in the standards
  Function = 5,
  Property = 6,

  ProcessingInstructionNode = 7,
  CommentNode = 8,
  Document = 9,
  DocumentTypeNode = 10,
  DocumentFragmentNode = 11,

  // Global Constructors and window function implementations
  EnvGlobalConstructor = 12,
}

export const enum WinDocId {
  document = 'd',
  documentElement = 'e',
  head = 'h',
  body = 'b',
}

export interface InitializeScriptData {
  $winId$: WinId;
  $instanceId$: InstanceId;
  $content$?: string;
  $url$?: string;
  $orgUrl$?: string;
}

export interface MainAccessRequest {
  $msgId$: string;
  $tasks$: MainAccessTask[];
}

export interface MainAccessTask {
  $winId$: WinId;
  $instanceId$: InstanceId;
  $applyPath$: ApplyPath;
  $groupedGetters$?: string[];
  $assignInstanceId$?: AssignInstanceId;
  $debug$?: string;
}

export interface MainAccessResponse {
  $msgId$: string;
  $error$?: string;
  $rtnValue$?: SerializedTransfer;
  $isPromise$?: any;
}

export const enum ApplyPathType {
  SetValue,
  GlobalConstructor,
}

export type ApplyPath = any[];

export const enum SerializedType {
  Primitive,
  Array,
  Object,
  Instance,
  Ref,
  Event,
  Function,
  NodeList,
  ArrayBuffer,
  ArrayBufferView,
  Attr,
  CSSRule,
  CSSRuleList,
  CSSStyleDeclaration,
  Error,
}

export type SerializedArrayTransfer = [SerializedType.Array, (SerializedTransfer | undefined)[]];

export type SerializedArrayBufferTransfer = [SerializedType.ArrayBuffer, any];

export type SerializedArrayBufferViewTransfer = [SerializedType.ArrayBufferView, any, string];

export type SerializedAttrTransfer = [SerializedType.Attr, SerializedAttr];

export type SerializedCSSRuleTransfer = [SerializedType.CSSRule, SerializedCSSRule];

export type SerializedCSSRuleListTransfer = [SerializedType.CSSRuleList, SerializedCSSRule[]];

export type SerializedCSSStyleDeclarationTransfer = [
  SerializedType.CSSStyleDeclaration,
  { [key: string]: SerializedTransfer | undefined }
];

export type SerializedErrorTransfer = [SerializedType.Error, Error];

export type SerializedEventTransfer = [SerializedType.Event, SerializedObject];

export type SerializedFunctionTransfer = [SerializedType.Function];

export type SerializedInstanceTransfer = [SerializedType.Instance, SerializedInstance];

export type SerializedNodeListTransfer = [
  SerializedType.NodeList,
  (SerializedTransfer | undefined)[]
];

export type SerializedObjectTransfer = [
  SerializedType.Object,
  { [key: string]: SerializedTransfer | undefined }
];

export type SerializedAttr = [string, string];

export type SerializedCSSRule = { [key: string]: string };

export type SerializedPrimitiveTransfer =
  | [SerializedType.Primitive, string | number | boolean | null | undefined]
  | [SerializedType.Primitive];

export type SerializedRefTransfer = [SerializedType.Ref, SerializedRefTransferData];

export interface SerializedRefTransferData {
  $winId$: WinId;
  $instanceId$: InstanceId;
  $refId$: RefId;
  $nodeName$?: string;
}

export type SerializedTransfer =
  | SerializedArrayTransfer
  | SerializedArrayBufferTransfer
  | SerializedArrayBufferViewTransfer
  | SerializedAttrTransfer
  | SerializedCSSRuleTransfer
  | SerializedCSSRuleListTransfer
  | SerializedCSSStyleDeclarationTransfer
  | SerializedEventTransfer
  | SerializedFunctionTransfer
  | SerializedInstanceTransfer
  | SerializedNodeListTransfer
  | SerializedObjectTransfer
  | SerializedPrimitiveTransfer
  | SerializedRefTransfer
  | SerializedErrorTransfer
  | [];

export interface SerializedObject {
  [key: string]: SerializedTransfer | undefined;
}

export type SerializedInstance =
  | [type: WinId, type: InstanceId]
  | [
      type: WinId,
      type: InstanceId,
      /**
       * Node name for Node instances
       */
      type: string,
      type?: string
    ];

/**
 * @public
 */
export type ResolveUrlType = 'fetch' | 'xhr' | 'script' | 'iframe' | 'image';

/**
 * @public
 */
export type SendBeaconParameters = Pick<
  RequestInit,
  'keepalive' | 'mode' | 'headers' | 'signal' | 'cache'
>;

/**
 * https://partytown.qwik.dev/configuration
 *
 * @public
 */
export interface PartytownConfig {
  /**
   * The `resolveUrl()` hook can be used to modify the URL about to be
   * requested, which could be used to rewrite urls so they go through a proxy.
   *
   * https://partytown.qwik.dev/proxying-requests
   *
   * @param url - The URL to be resolved. This is a URL https://developer.mozilla.org/en-US/docs/Web/API/URL, not a string.
   * @param location - The current window location.
   * @param type - The type of resource the url is being resolved for. For example, `fetch` is the value when resolving for `fetch()`, and `a` would be the value when resolving for an anchor element's `href`.
   * @returns The returned value must be a URL interface, otherwise the default resolved URL is used.
   */
  resolveUrl?(url: URL, location: Location, type: ResolveUrlType): URL | undefined | null;
  /**
   * The `resolveSendBeaconRequestParameters()` hook can be used to modify the RequestInit parameters
   * being used by the fetch request that polyfills the navigator.sendBeacon API in the worker context.
   *
   * @param url - The URL to be resolved. This is a URL https://developer.mozilla.org/en-US/docs/Web/API/URL, not a string.
   * @param location - The current window location.
   * @returns The returned value must be a SendBeaconParameters interface, otherwise the default parameters are used.
   */
  resolveSendBeaconRequestParameters?(
    url: URL,
    location: Location
  ): SendBeaconParameters | undefined | null;
  /**
   * When set to `true`, Partytown scripts are not inlined and not minified.
   *
   * https://partytown.qwik.dev/debugging
   */
  debug?: boolean;
  /**
   * Many third-party scripts provide a global variable which user code calls
   * in order to send data to the service. For example, Google Tag Manager uses
   * a [Data Layer](https://developers.google.com/tag-manager/devguide) array,
   * and by pushing data to the array, the data is then sent on to GTM. Because
   * we're moving third-party scripts to a web worker, the main thread needs to
   * know which variables to patch first, and when Partytown loads, it can then
   * forward the event data on to the service.
   *
   * Below is an example of Google Tag Manager and Facebook Pixel:
   *
   * ```js
   * ['dataLayer.push', 'fbq']
   * ```
   *
   * https://partytown.qwik.dev/forwarding-events
   */
  forward?: PartytownForwardProperty[];
  /**
   * Timeout in ms before the initialization considered failed and the fallback solution is executed
   * Default: 9999
   */
  fallbackTimeout?: number;
  /**
   * The css selector where the sandbox should be placed.
   * Default: body
   */
  sandboxParent?: string;
  mainWindowAccessors?: string[];
  /**
   * Rarely, a script will add a named function to the global scope with the
   * intent that other scripts can call the named function (like Adobe Launch).
   * Due to how Partytown scopes each script, these named functions do not get
   * added to `window`. The `globalFns` config can be used to manually ensure
   * each function is added to the global scope. Consider this an escape hatch
   * when a third-party script rudely pollutes `window` with functions.
   */
  globalFns?: string[];
  /**
   * This array can be used to filter which script are executed via
   * Partytown and which you would like to execute on the main thread.
   *
   * @example loadScriptsOnMainThread:['https://test.com/analytics.js', 'inline-script-id', /regex-matched-script\.js/]
   * // Loads the `https://test.com/analytics.js` script on the main thread
   */
  loadScriptsOnMainThread?: (string | RegExp)[];
  get?: GetHook;
  set?: SetHook;
  apply?: ApplyHook;
  /**
   * When set to true, the Partytown Web Worker will respect the `withCredentials` option of XMLHttpRequests.
   * Default: false
   */
  allowXhrCredentials?: boolean;
  /**
   * An absolute path to the root directory which Partytown library files
   * can be found. The library path must start and end with a `/`.
   * By default the files will load from the server's `/~partytown/` directory.
   * Note that the library path must be on the same origin as the html document,
   * and is also used as the `scope` of the Partytown service worker.
   */
  lib?: string;
  /**
   * Log method calls (debug mode required)
   */
  logCalls?: boolean;
  /**
   * Log getter calls (debug mode required)
   */
  logGetters?: boolean;
  /**
   * Log setter calls (debug mode required)
   */
  logSetters?: boolean;
  /**
   * Log Image() src requests (debug mode required)
   */
  logImageRequests?: boolean;
  /**
   * Log calls to main access, which also shows how many tasks were sent per message (debug mode required)
   */
  logMainAccess?: boolean;
  /**
   * Log script executions (debug mode required)
   */
  logScriptExecution?: boolean;
  /**
   * Log navigator.sendBeacon() requests (debug mode required)
   */
  logSendBeaconRequests?: boolean;
  /**
   * Log stack traces (debug mode required)
   */
  logStackTraces?: boolean;
  /**
   * Path to the service worker file. Defaults to `partytown-sw.js`.
   */
  swPath?: string;
  /**
   * The nonce property may be set on script elements created by Partytown.
   * This should be set only when dealing with content security policies
   * and when the use of `unsafe-inline` is disabled (using `nonce-*` instead).
   *
   * Given the following example:
   * ```html
   * <head>
   *   <script nonce="THIS_SHOULD_BE_REPLACED">
   *     partytown = {
   *       nonce: 'THIS_SHOULD_BE_REPLACED'
   *     };
   *   </script>
   * </head>
   * ```
   *
   * The `nonce` property should be generated by the server, and it should be unique
   * for each request. You can leave a placeholder, as shown in the above example,
   * to facilitate replacement through a regular expression on the server side.
   * For instance, you can use the following code:
   *
   * ```js
   * html.replace(/THIS_SHOULD_BE_REPLACED/g, nonce);
   * ```
   */
  nonce?: string;
}

export type PartytownInternalConfig = Omit<PartytownConfig, 'loadScriptsOnMainThread'> & {
  loadScriptsOnMainThread?: ['regexp' | 'string', string][];
};

/**
 * @public
 */
export type PartytownForwardPropertySettings = {
  preserveBehavior?: boolean;
};

/**
 * @public
 */
export type PartytownForwardPropertyWithSettings = [string, PartytownForwardPropertySettings?];

/**
 * A forward property to patch on `window`. The forward config property is an string,
 * representing the call to forward, such as `dataLayer.push` or `fbq`.
 *
 * https://partytown.qwik.dev/forwarding-events
 *
 * @public
 */
export type PartytownForwardProperty = string | PartytownForwardPropertyWithSettings;

/**
 * @public
 */
export type GetHook = (opts: GetHookOptions) => any;

/**
 * @public
 */
export type SetHook = (opts: SetHookOptions) => any;

/**
 * @public
 */
export type ApplyHook = (opts: ApplyHookOptions) => any;

export interface HookOptions {
  name: string;
  continue: Symbol;
  nodeName: string | undefined;
  constructor: string | undefined;
  instance: WorkerInstance;
  window: Window;
}

/**
 * @public
 */
export interface GetHookOptions extends HookOptions {}

/**
 * @public
 */
export interface SetHookOptions extends HookOptions {
  value: any;
  prevent: Symbol;
}

/**
 * @public
 */
export interface ApplyHookOptions extends HookOptions {
  args: any[];
}

export type StringIndexable = {
  [key: string]: any;
};

export interface MainWindow extends Window, StringIndexable {
  partytown?: PartytownConfig;
  _ptf?: any[];
  _pttab?: number;
}

export const enum NodeName {
  Body = 'BODY',
  Comment = '#comment',
  Document = '#document',
  /**
   * <html>
   */
  DocumentElement = 'HTML',
  /**
   * <!DOCTYPE html>
   */
  DocumentTypeNode = 'html',
  DocumentFragment = '#document-fragment',
  IFrame = 'IFRAME',
  Head = 'HEAD',
  Script = 'SCRIPT',
  Text = '#text',
}

export const enum StateProp {
  errorHandlers = 'error',
  loadHandlers = 'load',
  src = 0,
  loadErrorStatus = 1,
  cssRules = 2,
  innerHTML = 3,
  url = 4,
  type = 5,
}

export type EventHandler = (ev: any) => void;

export type RefHandler = (...args: any[]) => void;

export type StateMap = Record<number, StateRecord>;

export type StateRecord = Record<string | number, any>;

export const enum CallType {
  Blocking = 1,
  NonBlocking = 2,
  NonBlockingNoSideEffect = 3,
}

export type Getter = (instance: any, applyPath: ApplyPath, groupedGetters?: string[]) => any;

export type Setter = (instance: any, applyPath: ApplyPath, value: any) => void;

export type CallMethod = (
  instance: any,
  applyPath: ApplyPath,
  args: any[],
  callType?: CallType,
  assignInstanceId?: AssignInstanceId,
  buffer?: ArrayBuffer | ArrayBufferView
) => any;

export type ConstructGlobal = (instance: any, cstrName: string, args: any[]) => void;

export type DefinePrototypePropertyDescriptor = (Cstr: any, propertyDescriptorMap: any) => void;

export type RandomId = () => string;

import type {
  ApplyPathKey,
  InstanceDataKey,
  InstanceIdKey,
  InstanceStateKey,
  NamespaceKey,
  WinIdKey,
} from './web-worker/worker-constants';

export type LazyBridge = [
  Getter,
  Setter,
  CallMethod,
  ConstructGlobal,
  DefinePrototypePropertyDescriptor,
  RandomId,
  typeof WinIdKey,
  typeof InstanceIdKey,
  typeof ApplyPathKey
];

export type InitWindowMedia = (
  WorkerBase: WorkerConstructor,
  WorkerEventTargetProxy: WorkerConstructor,
  env: WebWorkerEnvironment,
  win: WorkerWindow,
  windowMediaConstructors: string[]
) => any;

export interface MediaSelf {
  $bridgeToMedia$?: LazyBridge;
  $bridgeFromMedia$?: InitWindowMedia;
}

export interface PostMessageData {
  $winId$: WinId;
  $data$: string;
}

export interface WorkerConstructor {
  new (
    winId?: WinId,
    instanceId?: InstanceId,
    applyPath?: ApplyPath,
    instanceData?: any,
    namespace?: string
  ): WorkerInstance;
}

export interface WorkerInstance {
  [WinIdKey]: WinId;
  [InstanceIdKey]: InstanceId;
  [ApplyPathKey]: string[];
  [InstanceDataKey]: string | undefined;
  [NamespaceKey]: string | undefined;
  [InstanceStateKey]: { [key: string]: any };
}

export interface WorkerNode extends WorkerInstance, Node {
  id?: string | undefined | null;
  type: string | undefined;
}

export interface WorkerWindow extends WorkerInstance {
  [key: string]: any;
}

export interface WorkerNodeConstructors {
  [tagName: string]: WorkerConstructor;
}

export type CustomElementData = [cstrName: string, observedAttributes: string[]];
