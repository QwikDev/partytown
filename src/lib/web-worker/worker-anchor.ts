import { commaSplit } from './worker-constants';
import { definePrototypePropertyDescriptor, isValidUrl } from '../utils';
import { getInstanceStateValue, setInstanceStateValue } from './worker-state';
import { getter, setter } from './worker-proxy';
import { resolveToUrl } from './worker-exec';
import { StateProp, type WebWorkerEnvironment, type WorkerNode } from '../types';

export const patchHTMLAnchorElement = (WorkerHTMLAnchorElement: any, env: WebWorkerEnvironment) => {
  const HTMLAnchorDescriptorMap: PropertyDescriptorMap & ThisType<WorkerNode> = {};

  commaSplit('hash,host,hostname,href,origin,pathname,port,protocol,search').map((anchorProp) => {
    HTMLAnchorDescriptorMap[anchorProp] = {
      get(this: any) {
        let value = getInstanceStateValue(this, StateProp.url);
        let href: string;

        if (typeof value !== 'string') {
          href = getter(this, ['href']);
          if (href === '') {
            if (anchorProp === 'protocol') {
              return ':';
            }
            return '';
          }

          setInstanceStateValue(this, StateProp.url, href);
          value = (new URL(href) as any)[anchorProp];
        }

        return (resolveToUrl(env, value, null) as any)[anchorProp];
      },

      set(this: any, value) {
        let url;

        if (anchorProp === 'href') {
          if (isValidUrl(value)) {
            url = new URL(value);
          } else {
            const baseHref = env.$location$.href;
            url = resolveToUrl(env, baseHref, null);
            url.href = new URL(value + '', url.href);
          }
        } else {
          url = resolveToUrl(env, this.href, null);
          url[anchorProp] = value;
        }

        setInstanceStateValue(this, StateProp.url, url.href);

        setter(this, ['href'], url.href);
      },
    };
  });

  definePrototypePropertyDescriptor(WorkerHTMLAnchorElement, HTMLAnchorDescriptorMap);
};
