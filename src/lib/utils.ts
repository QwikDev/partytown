import type {
  ApplyPath,
  MainWindow,
  PartytownConfig,
  PartytownForwardProperty,
  PartytownForwardPropertySettings,
  PartytownForwardPropertyWithSettings,
  PartytownInternalConfig,
  RandomId,
  StringIndexable,
} from './types';

export const debug = !!(globalThis as any).partytownDebug;

export const isPromise = (v: any): v is Promise<unknown> => typeof v === 'object' && v && v.then;

export const noop = () => {};

export const len = (obj: { length: number }) => obj.length;

type ObjectWithConstructor = { constructor?: Function };
type ObjectWithZoneJsConstructor = { __zone_symbol__originalInstance?: ObjectWithConstructor };

export const getConstructorName = (obj: Object) => {
  try {
    const constructorName = obj?.constructor?.name;
    if (constructorName) return constructorName;
  } catch (e) {}
  try {
    const zoneJsConstructorName = (obj as ObjectWithZoneJsConstructor)
      ?.__zone_symbol__originalInstance?.constructor?.name;
    if (zoneJsConstructorName) return zoneJsConstructorName;
  } catch (e) {}

  return '';
};

export const startsWith = (str: string, val: string) => str.startsWith(val);

// Chrome APIs that trigger deprecation warnings when accessed on window.
// Accessing these during platform introspection causes console noise.
// https://github.com/QwikDev/partytown/issues/694
export const DEPRECATED_WINDOW_PROPERTIES = new Set([
  'sharedStorage',
  'SharedStorage',
  'AttributionReporting',
  'attributionReporting',
  'AttributionReportingRequestOptions',
  'attributionSrc',
  'setAttributionReporting',
]);

export const isValidMemberName = (memberName: string) =>
  !(
    startsWith(memberName, 'webkit') ||
    startsWith(memberName, 'toJSON') ||
    startsWith(memberName, 'constructor') ||
    startsWith(memberName, 'toString') ||
    startsWith(memberName, '_') ||
    DEPRECATED_WINDOW_PROPERTIES.has(memberName)
  );

export const getLastMemberName = (applyPath: ApplyPath, i?: number) => {
  for (i = len(applyPath) - 1; i >= 0; i--) {
    if (typeof applyPath[i] === 'string') {
      return applyPath[i] as string;
    }
  }
  return applyPath[0] as string;
};

export const getNodeName = (node: Node) =>
  node.nodeType === 11 && (node as any).host ? '#s' : node.nodeName;

export const EMPTY_ARRAY = [];
if (debug) {
  /*#__PURE__*/ Object.freeze(EMPTY_ARRAY);
}

export const randomId: RandomId = () =>
  Math.round(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);

/**
 * The `type` attribute for Partytown scripts, which does two things:
 *
 * 1. Prevents the `<script>` from executing on the main thread.
 * 2. Is used as a selector so the Partytown library can find all scripts to execute in a web worker.
 *
 * @public
 */
export const SCRIPT_TYPE = `text/partytown`;

export const SCRIPT_TYPE_EXEC = `-x`;

export const defineProperty = (obj: any, memberName: string, descriptor: PropertyDescriptor) =>
  Object.defineProperty(obj, memberName, { ...descriptor, configurable: true });

export const defineConstructorName = (Cstr: any, value: string) =>
  defineProperty(Cstr, 'name', {
    value,
  });

export const definePrototypeProperty = (
  Cstr: any,
  memberName: string,
  descriptor: PropertyDescriptor
) => defineProperty(Cstr.prototype, memberName, descriptor);

export const definePrototypePropertyDescriptor = (Cstr: any, propertyDescriptorMap: any) =>
  Object.defineProperties(Cstr.prototype, propertyDescriptorMap);

export const definePrototypeValue = (Cstr: any, memberName: string, value: any) =>
  definePrototypeProperty(Cstr, memberName, {
    value,
    writable: true,
  });

const htmlConstructorTags: { [key: string]: string } = {
  Anchor: 'a',
  DList: 'dl',
  Image: 'img',
  OList: 'ol',
  Paragraph: 'p',
  Quote: 'q',
  TableCaption: 'caption',
  TableCell: 'td',
  TableCol: 'colgroup',
  TableRow: 'tr',
  TableSection: 'tbody',
  UList: 'ul',
};

const svgConstructorTags: { [key: string]: string } = {
  Graphics: 'g',
  SVG: 'svg',
};

export const createElementFromConstructor = (
  doc: Document,
  interfaceName: string,
  r?: RegExpMatchArray | null,
  tag?: string
) => {
  r = interfaceName.match(/^(HTML|SVG)(.+)Element$/);
  if (r) {
    tag = r[2];
    return interfaceName[0] == 'S'
      ? doc.createElementNS(
          'http://www.w3.org/2000/svg',
          svgConstructorTags[tag] || tag.slice(0, 2).toLowerCase() + tag.slice(2)
        )
      : doc.createElement(htmlConstructorTags[tag] || tag);
  }
};

export const isValidUrl = (url: any): boolean => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

const defaultPartytownForwardPropertySettings: Required<PartytownForwardPropertySettings> = {
  preserveBehavior: false,
};

export const resolvePartytownForwardProperty = (
  propertyOrPropertyWithSettings: PartytownForwardProperty
): Required<PartytownForwardPropertyWithSettings> => {
  if (typeof propertyOrPropertyWithSettings === 'string') {
    return [propertyOrPropertyWithSettings, defaultPartytownForwardPropertySettings];
  }
  const [property, settings = defaultPartytownForwardPropertySettings] =
    propertyOrPropertyWithSettings;
  return [property, { ...defaultPartytownForwardPropertySettings, ...settings }];
};

type GetOriginalBehaviorReturn = {
  thisObject: StringIndexable;
  methodOrProperty: Function | Record<string, unknown> | undefined;
};

export const getOriginalBehavior = (
  window: MainWindow,
  properties: string[]
): GetOriginalBehaviorReturn => {
  let thisObject: StringIndexable = window;

  for (let i = 0; i < properties.length - 1; i += 1) {
    thisObject = thisObject[properties[i]];
  }

  return {
    thisObject,
    methodOrProperty:
      properties.length > 0 ? thisObject[properties[properties.length - 1]] : undefined,
  };
};

const getMethods = (obj: {} | []): string[] => {
  const properties = new Set<string>();
  let currentObj: any = obj;
  do {
    Object.getOwnPropertyNames(currentObj).forEach((item) => {
      if (typeof currentObj[item] === 'function') {
        properties.add(item);
      }
    });
  } while ((currentObj = Object.getPrototypeOf(currentObj)) !== Object.prototype);
  return Array.from(properties);
};

const arrayMethods = Object.freeze(getMethods([]));

export const emptyObjectValue = (propertyName: string): [] | {} => {
  if (arrayMethods.includes(propertyName)) {
    return [];
  }

  return {};
};

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function testIfMustLoadScriptOnMainThread(
  config: PartytownInternalConfig,
  value: string
): boolean {
  return (
    config.loadScriptsOnMainThread
      ?.map(([type, value]) => new RegExp(type === 'string' ? escapeRegExp(value) : value))
      .some((regexp) => regexp.test(value)) ?? false
  );
}

export function serializeConfig(config: PartytownConfig) {
  return JSON.stringify(config, (key, value) => {
    if (typeof value === 'function') {
      value = String(value);
      if (value.startsWith(key + '(')) {
        value = 'function ' + value;
      }
    }
    if (key === 'loadScriptsOnMainThread') {
      value = (
        value as Required<PartytownConfig | PartytownInternalConfig>['loadScriptsOnMainThread']
      ).map((scriptUrl) =>
        Array.isArray(scriptUrl)
          ? scriptUrl
          : [
              typeof scriptUrl === 'string' ? 'string' : 'regexp',
              typeof scriptUrl === 'string' ? scriptUrl : scriptUrl.source,
            ]
      ) satisfies Required<PartytownInternalConfig>['loadScriptsOnMainThread'];
    }
    return value;
  });
}
