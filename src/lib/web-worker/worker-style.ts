import { cachedDimensions } from './worker-constants';
import { callMethod, getter } from './worker-proxy';
import { CallType, StateProp, type WorkerNode } from '../types';
import { defineConstructorName, definePrototypePropertyDescriptor, len } from '../utils';
import { getInstanceStateValue, setInstanceStateValue } from './worker-state';
import { logDimensionCacheClearMethod } from '../log';

export const createCSSStyleSheetConstructor = (win: any, cssStyleSheetCstrName: string) => {
  win[cssStyleSheetCstrName] = defineConstructorName(
    class {
      ownerNode: WorkerNode;

      constructor(ownerNode: WorkerNode) {
        this.ownerNode = ownerNode;
      }

      get cssRules() {
        const ownerNode = this.ownerNode;
        return new Proxy(
          {},
          {
            get(target: any, propKey) {
              const propName = String(propKey);
              if (propName === 'item') {
                return (index: number) => getCssRule(ownerNode, index);
              }
              if (propName === 'length') {
                return getCssRules(ownerNode).length;
              }
              if (!isNaN(propName as any)) {
                return getCssRule(ownerNode, propName);
              }
              return target[propKey];
            },
          }
        );
      }

      insertRule(ruleText: string, index: number | undefined) {
        const cssRules = getCssRules(this.ownerNode);
        index = index === undefined ? 0 : index;
        if (index >= 0 && index <= cssRules.length) {
          callMethod(
            this.ownerNode,
            ['sheet', 'insertRule'],
            [ruleText, index],
            CallType.NonBlocking
          );
          // insert bogus data so the array/length is correct
          // but later on, if we ever want to "read" this inserted rule
          // we do a real lookup to get the dom correct data
          cssRules.splice(index, 0, 0);
        }
        logDimensionCacheClearMethod(this.ownerNode, 'insertRule');
        cachedDimensions.clear();
        return index;
      }

      deleteRule(index: number) {
        callMethod(this.ownerNode, ['sheet', 'deleteRule'], [index], CallType.NonBlocking);
        getCssRules(this.ownerNode).splice(index, 1);
        logDimensionCacheClearMethod(this.ownerNode, 'deleteRule');
        cachedDimensions.clear();
      }

      get type() {
        return 'text/css';
      }
    },
    cssStyleSheetCstrName
  );

  const HTMLStyleDescriptorMap: PropertyDescriptorMap & ThisType<WorkerNode> = {
    sheet: {
      get() {
        return new win[cssStyleSheetCstrName](this);
      },
    },
  };

  definePrototypePropertyDescriptor(win.HTMLStyleElement, HTMLStyleDescriptorMap);
};

const getCssRules = (ownerNode: WorkerNode, cssRules?: any): any[] => {
  cssRules = getInstanceStateValue(ownerNode, StateProp.cssRules);
  if (!cssRules) {
    cssRules = getter(ownerNode, ['sheet', 'cssRules']);
    setInstanceStateValue(ownerNode, StateProp.cssRules, cssRules);
  }
  return cssRules;
};

const getCssRule = (ownerNode: WorkerNode, index: any, cssRules?: any) => {
  cssRules = getCssRules(ownerNode);
  if (cssRules[index] === 0) {
    cssRules[index] = getter(ownerNode, ['sheet', 'cssRules', parseInt(index, 10)]);
  }
  return cssRules[index];
};

export const createCSS = (win: any) => {
  win.CSS = new Proxy(
    { escape: cssEscape },
    {
      get: (target: any, prop) =>
        Object.prototype.hasOwnProperty.call(target, prop) || typeof prop !== 'string'
          ? target[prop]
          : getter(win, ['CSS', prop]),
    }
  );
};

// https://drafts.csswg.org/cssom/#serialize-an-identifier
const cssEscape = (...args: any[]) => {
  if (!len(args)) {
    throw new TypeError(
      "Failed to execute 'escape' on 'CSS': 1 argument required, but only 0 present."
    );
  }
  const str = String(args[0]);
  const firstCodeUnit = str.charCodeAt(0);
  let result = '';
  let codeUnit: number;

  for (let index = 0; index < len(str); index++) {
    codeUnit = str.charCodeAt(index);
    if (codeUnit === 0x0000) {
      result += '\uFFFD';
    } else if (
      (codeUnit >= 0x0001 && codeUnit <= 0x001f) ||
      codeUnit === 0x007f ||
      (index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
      (index === 1 && codeUnit >= 0x0030 && codeUnit <= 0x0039 && firstCodeUnit === 0x002d)
    ) {
      result += '\\' + codeUnit.toString(16) + ' ';
    } else if (index === 0 && len(str) === 1 && codeUnit === 0x002d) {
      result += '\\' + str.charAt(index);
    } else if (
      codeUnit >= 0x0080 ||
      codeUnit === 0x002d ||
      codeUnit === 0x005f ||
      (codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
      (codeUnit >= 0x0041 && codeUnit <= 0x005a) ||
      (codeUnit >= 0x0061 && codeUnit <= 0x007a)
    ) {
      result += str.charAt(index);
    } else {
      result += '\\' + str.charAt(index);
    }
  }
  return result;
};
