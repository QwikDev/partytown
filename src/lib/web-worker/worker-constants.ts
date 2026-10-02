import type {
  InstanceId,
  InterfaceInfo,
  PostMessageData,
  RefHandler,
  RefId,
  WebWorkerContext,
  WebWorkerEnvironment,
  WinId,
  WorkerNode,
} from '../types';

export const WinIdKey = /*#__PURE__*/ Symbol();
export const InstanceIdKey = /*#__PURE__*/ Symbol();
export const InstanceDataKey = /*#__PURE__*/ Symbol();
export const NamespaceKey = /*#__PURE__*/ Symbol();
export const ApplyPathKey = /*#__PURE__*/ Symbol();
export const InstanceStateKey = /*#__PURE__*/ Symbol();
export const HookContinue = /*#__PURE__*/ Symbol();
export const HookPrevent = /*#__PURE__*/ Symbol();

export const webWorkerInstances = /*#__PURE__*/ new Map<InstanceId, WorkerNode>();
export const webWorkerRefsByRefId: { [refId: RefId]: RefHandler } = {};
export const webWorkerRefIdsByRef = /*#__PURE__*/ new WeakMap<RefHandler, RefId>();
export const postMessages: PostMessageData[] = [];

export const webWorkerCtx: WebWorkerContext = {} as any;
export const webWorkerInterfaces: InterfaceInfo[] = [];
export const environments: { [winId: WinId]: WebWorkerEnvironment } = {};

export const cachedDimensions = /*#__PURE__*/ new Map<string, any>();
export const cachedStructure = /*#__PURE__*/ new Map<string, any>();

export const ABOUT_BLANK = 'about:blank';

export const commaSplit = (str: string) => str.split(',');

export const partytownLibUrl = (url: string) => {
  url = webWorkerCtx.$libPath$ + url;
  if (new URL(url).origin != location.origin) {
    throw 'Invalid ' + url;
  }
  return url;
};

/** Cached dimension getters. Scroll offsets must be read live from the main thread. */
export const getterDimensionPropNames = /*#__PURE__*/ commaSplit(
  'clientWidth,clientHeight,clientTop,clientLeft,innerWidth,innerHeight,offsetWidth,offsetHeight,offsetTop,offsetLeft,outerWidth,outerHeight,scrollWidth,scrollHeight'
);

/** element properties in regards to the DOM structure */
export const elementStructurePropNames = /*#__PURE__*/ commaSplit(
  'childElementCount,children,firstElementChild,lastElementChild,nextElementSibling,previousElementSibling'
);

/** methods that could change the DOM structure */
export const structureChangingMethodNames = /*#__PURE__*/ commaSplit(
  'insertBefore,remove,removeChild,replaceChild'
);

/** setters that could change dimensions of elements */
export const dimensionChangingSetterNames = /*#__PURE__*/ commaSplit(
  'className,width,height,hidden,innerHTML,innerText,textContent,text'
);

/** method calls that could change dimensions of elements */
export const dimensionChangingMethodNames = /*#__PURE__*/ commaSplit(
  'setAttribute,setAttributeNS,setProperty'
);

export const eventTargetMethods = /*#__PURE__*/ commaSplit(
  'addEventListener,dispatchEvent,removeEventListener'
);

export const nonBlockingMethods = /*#__PURE__*/ eventTargetMethods.concat(
  dimensionChangingMethodNames,
  /*#__PURE__*/ commaSplit('add,observe,remove,unobserve')
);

export const IS_TAG_REG = /^[A-Z_]([A-Z0-9-]*[A-Z0-9])?$/;
