import { debug } from '../utils';
import type { EventHandler, WebWorkerEnvironment } from '../types';
import { logWorker } from '../log';
import { resolveUrl } from './worker-exec';
import { webWorkerCtx } from './worker-constants';

type HTMLImageElementEvents = 'load' | 'error';

export const createImageConstructor = (env: WebWorkerEnvironment) =>
  class HTMLImageElement {
    s: string;
    l: EventHandler[];
    e: EventHandler[];
    style: Record<string, string>;
    attributes: Map<string, string>;

    constructor() {
      this.s = '';
      this.l = [];
      this.e = [];
      this.style = {};
      this.attributes = new Map();
    }

    get src() {
      return this.s;
    }
    set src(src: string) {
      if (debug && webWorkerCtx.$config$.logImageRequests) {
        logWorker(`Image() request: ${resolveUrl(env, src, 'image')}`, env.$winId$);
      }

      this.s = src;

      fetch(resolveUrl(env, src, 'image'), {
        mode: 'no-cors',
        credentials: 'include',
        keepalive: true,
      }).then(
        (rsp) => {
          if (rsp.ok || rsp.status === 0) {
            this.l.map((cb) => cb({ type: 'load' }));
          } else {
            this.e.map((cb) => cb({ type: 'error' }));
          }
        },
        () => this.e.forEach((cb) => cb({ type: 'error' }))
      );
    }

    getAttribute(name: string): string | null {
      const value = this.attributes.get(name.toLowerCase());
      return value !== undefined ? value : null;
    }

    setAttribute(name: string, value: string): void {
      this.attributes.set(name.toLowerCase(), String(value));
      if (name.toLowerCase() === 'src') {
        this.src = value;
      }
    }

    hasAttribute(name: string): boolean {
      return this.attributes.has(name.toLowerCase());
    }

    removeAttribute(name: string): void {
      this.attributes.delete(name.toLowerCase());
    }

    toggleAttribute(name: string, force?: boolean): boolean {
      const normalizedName = name.toLowerCase();
      const hasAttr = this.attributes.has(normalizedName);
      
      if (force !== undefined) {
        if (force) {
          if (!hasAttr) {
            this.attributes.set(normalizedName, '');
          }
          return true;
        } else {
          this.attributes.delete(normalizedName);
          return false;
        }
      }
      
      if (hasAttr) {
        this.attributes.delete(normalizedName);
        return false;
      } else {
        this.attributes.set(normalizedName, '');
        return true;
      }
    }

    addEventListener(eventName: HTMLImageElementEvents, cb: EventHandler) {
      if (eventName === 'load') {
        this.l.push(cb);
      }
      if (eventName === 'error') {
        this.e.push(cb);
      }
    }

    removeEventListener(eventName: HTMLImageElementEvents, cb: EventHandler) {
      if (eventName === 'load') {
        this.l = this.l.filter((fn) => fn !== cb);
      }
      if (eventName === 'error') {
        this.e = this.e.filter((fn) => fn !== cb);
      }
    }

    get onload() {
      return this.l[0];
    }
    set onload(cb: EventHandler) {
      this.l = [cb];
    }

    get onerror() {
      return this.e[0];
    }
    set onerror(cb: EventHandler) {
      this.e = [cb];
    }
  };
