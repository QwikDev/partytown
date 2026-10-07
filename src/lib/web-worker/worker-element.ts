import {
  cachedDimensionMethods,
  cachedDimensionProps,
  cachedProps,
  cachedTreeProps,
} from './worker-constructors';
import {
  commaSplit,
  elementStructurePropNames,
  InstanceDataKey,
  NamespaceKey,
  webWorkerCtx,
} from './worker-constants';
import {
  getInstanceStateValue,
  hasInstanceStateValue,
  setInstanceStateValue,
} from './worker-state';
import { getter, setter } from './worker-proxy';
import { definePrototypePropertyDescriptor } from '../utils';
import type { WorkerNode } from '../types';

export const patchElement = (WorkerElement: any, WorkerHTMLElement: any) => {
  const ElementDescriptorMap: PropertyDescriptorMap & ThisType<WorkerNode> = {
    localName: {
      get() {
        return this[InstanceDataKey]!.toLowerCase();
      },
    },
    namespaceURI: {
      get() {
        return this[NamespaceKey] || 'http://www.w3.org/1999/xhtml';
      },
    },
    nodeType: {
      value: 1,
    },
    tagName: {
      get() {
        return this[InstanceDataKey];
      },
    },
  };

  // Configured expando properties (`mainElementProperties`) also live on the main thread element,
  // e.g. a function an iframe's inline `onload` calls; the worker keeps reading what it set.
  (webWorkerCtx.$config$.mainElementProperties || []).map((propName) => {
    ElementDescriptorMap[propName] = {
      get(this: WorkerNode) {
        return hasInstanceStateValue(this, propName)
          ? getInstanceStateValue(this, propName)
          : getter(this, [propName]);
      },
      set(this: WorkerNode, value: any) {
        setInstanceStateValue(this, propName, value);
        setter(this, [propName], value);
      },
    };
  });

  definePrototypePropertyDescriptor(WorkerElement, ElementDescriptorMap);

  // Element
  cachedTreeProps(WorkerElement, elementStructurePropNames);
  cachedProps(WorkerElement, 'id');

  // HTMLElement
  cachedDimensionProps(WorkerHTMLElement);
  cachedDimensionMethods(WorkerHTMLElement, commaSplit('getClientRects,getBoundingClientRect'));
};
