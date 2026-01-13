import type { MainWindow, PartytownConfig } from '../types';
import { debug } from '../utils';

export const mainWindow: MainWindow = window.parent;
export const docImpl = document.implementation.createHTMLDocument();

export const config: PartytownConfig = mainWindow.partytown || {};
export const libPath = (config.lib || '/~partytown/') + (debug ? 'debug/' : '');

/**
 * Check if an iframe URL should be loaded on the main thread instead of inside the sandbox.
 * Handles both original format (string | RegExp)[] and serialized format ['regexp'|'string', pattern][].
 */
export const shouldLoadIframeOnMainThread = (url: string): boolean => {
  const patterns = config.loadIframesOnMainThread;
  if (!patterns) return false;

  return patterns.some((pattern: any) => {
    // Handle serialized format: ['regexp', 'pattern'] or ['string', 'pattern']
    if (Array.isArray(pattern)) {
      const [type, value] = pattern;
      if (type === 'regexp') {
        return new RegExp(value).test(url);
      } else if (type === 'string') {
        return url.includes(value);
      }
      return false;
    }
    // Handle original format: string or RegExp
    if (typeof pattern === 'string') {
      return url.includes(pattern);
    }
    if (pattern instanceof RegExp) {
      return pattern.test(url);
    }
    return false;
  });
};
