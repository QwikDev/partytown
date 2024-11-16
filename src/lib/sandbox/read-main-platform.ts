import {
  createElementFromConstructor,
  getConstructorName,
  getNodeName,
  isValidMemberName,
  noop,
  serializeConfig,
} from '../utils';
import { config, docImpl, libPath, mainWindow } from './main-globals';
import { InterfaceType, InterfaceInfo, InterfaceMember, InitWebWorkerData } from '../types';

export const readMainPlatform = () => {
  const elm = docImpl.createElement('i');
  const textNode = docImpl.createTextNode('');
  const comment = docImpl.createComment('');
  const frag = docImpl.createDocumentFragment();
  const shadowRoot = docImpl.createElement('p').attachShadow({ mode: 'open' });
  const intersectionObserver = getGlobalConstructor(mainWindow, 'IntersectionObserver');
  const mutationObserver = getGlobalConstructor(mainWindow, 'MutationObserver');
  const resizeObserver = getGlobalConstructor(mainWindow, 'ResizeObserver');
  const perf = mainWindow.performance;
  const screen = mainWindow.screen;

  const impls: any[] = [
    // window implementations
    [mainWindow.history],
    [perf],
    [perf.navigation],
    [perf.timing],
    [screen],
    [screen.orientation],
    [mainWindow.visualViewport],

    // global constructors
    [intersectionObserver, InterfaceType.EnvGlobalConstructor],
    [mutationObserver, InterfaceType.EnvGlobalConstructor],
    [resizeObserver, InterfaceType.EnvGlobalConstructor],

    // dom implementations
    [textNode],
    [comment],
    [frag],
    [shadowRoot],
    [elm],
    [elm.attributes],
    [elm.classList],
    [elm.dataset],
    [elm.style],
    [docImpl],
    [docImpl.doctype!],
  ];

  const initialInterfaces: InterfaceInfo[] = [
    readImplementation('Window', mainWindow),
    readImplementation('Node', textNode),
  ];

  const $config$ = serializeConfig(config);

  const initWebWorkerData: InitWebWorkerData = {
    $config$,
    $interfaces$: readImplementations(impls, initialInterfaces),
    $libPath$: new URL(libPath, mainWindow.location as any) + '',
    $origin$: origin,
    $tabId$: mainWindow._pttab,
  };

  addGlobalConstructorUsingPrototype(
    initWebWorkerData.$interfaces$,
    mainWindow,
    'IntersectionObserverEntry'
  );

  return initWebWorkerData;
};

export const readMainInterfaces = () => {
  // get all HTML*Element constructors on window
  // and create each element to get their implementation
  const elms = Object.getOwnPropertyNames(mainWindow)
    .map((interfaceName) => createElementFromConstructor(docImpl, interfaceName))
    .filter((elm) => {
      if (!elm) {
        return false;
      }
      const constructorName = getConstructorName(elm);
      return !(
        constructorName === 'HTMLUnknownElement' && elm.nodeName.toUpperCase() !== 'UNKNOWN'
      );
    })
    .map((elm) => [elm]);

  return readImplementations(elms, []);
};

const readImplementations = (impls: any[], interfaces: InterfaceInfo[]) => {
  const cstrs = new Set(['Object']);
  const cstrImpls = impls
    .filter((implData) => implData[0])
    .map((implData) => {
      const impl = implData[0];
      const interfaceType: InterfaceType = implData[1] as any;
      const cstrName = getConstructorName(impl);
      const CstrPrototype = (mainWindow as any)[cstrName].prototype;
      return [cstrName, CstrPrototype, impl, interfaceType];
    });

  cstrImpls.map(([cstrName, CstrPrototype, impl, intefaceType]) =>
    readOwnImplementation(cstrs, interfaces, cstrName, CstrPrototype, impl, intefaceType)
  );

  return interfaces;
};

const readImplementation = (cstrName: string, impl: any, memberName?: string) => {
  let interfaceMembers: InterfaceMember[] = [];
  let interfaceInfo: InterfaceInfo = [cstrName, 'Object', interfaceMembers];
  for (memberName in impl) {
    readImplementationMember(interfaceMembers, impl, memberName);
  }
  return interfaceInfo;
};

const readOwnImplementation = (
  cstrs: Set<string>,
  interfaces: InterfaceInfo[],
  cstrName: string,
  CstrPrototype: any,
  impl: any,
  interfaceType: InterfaceType
) => {
  if (!cstrs.has(cstrName)) {
    cstrs.add(cstrName);
    const SuperCstr = Object.getPrototypeOf(CstrPrototype);
    const superCstrName = getConstructorName(SuperCstr);
    const interfaceMembers: InterfaceMember[] = [];
    const propDescriptors = Object.getOwnPropertyDescriptors(CstrPrototype);

    readOwnImplementation(cstrs, interfaces, superCstrName, SuperCstr, impl, interfaceType);

    for (const memberName in propDescriptors) {
      readImplementationMember(interfaceMembers, impl, memberName);
    }

    interfaces.push([cstrName, superCstrName, interfaceMembers, interfaceType, getNodeName(impl)]);
  }
};

const readImplementationMember = (
  interfaceMembers: InterfaceMember[],
  implementation: any,
  memberName: string,
  value?: any,
  memberType?: string,
  cstrName?: string
) => {
  try {
    if (isValidMemberName(memberName) && isNaN((memberName as any)[0]) && memberName !== 'all') {
      value = implementation[memberName];
      memberType = typeof value;

      if (memberType === 'function') {
        if (
          String(value).includes(`[native`) ||
          Object.getPrototypeOf(implementation)[memberName]
        ) {
          interfaceMembers.push([memberName, InterfaceType.Function]);
        }
      } else if (memberType === 'object' && value != null) {
        cstrName = getConstructorName(value);
        if (cstrName !== 'Object' && cstrName !== 'Function' && (self as any)[cstrName]) {
          interfaceMembers.push([memberName, value.nodeType || cstrName]);
        }
      } else if (memberType !== 'symbol') {
        // everything else that's not a symbol
        if (memberName.toUpperCase() === memberName) {
          // static property, let's get its value
          interfaceMembers.push([memberName, InterfaceType.Property, value]);
        } else {
          interfaceMembers.push([memberName, InterfaceType.Property]);
        }
      }
    }
  } catch (e) {
    console.warn(e);
  }
};

const getGlobalConstructor = (mainWindow: any, cstrName: string) =>
  typeof mainWindow[cstrName] !== 'undefined' ? new mainWindow[cstrName](noop) : 0;

const addGlobalConstructorUsingPrototype = (
  $interfaces$: InterfaceInfo[],
  mainWindow: any,
  cstrName: string
) => {
  if (typeof mainWindow[cstrName] !== 'undefined') {
    // we don't have an actual implementation, only the prototype
    // so let's just read what props exist, and assume they're all values, not functions
    $interfaces$.push([
      cstrName,
      'Object',
      Object.keys(mainWindow[cstrName].prototype).map((propName) => [
        propName,
        InterfaceType.Property,
      ]),
      InterfaceType.EnvGlobalConstructor,
    ]);
  }
};
