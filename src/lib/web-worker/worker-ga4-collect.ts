/**
 * GA4 Measurement Protocol Helper
 *
 * This module provides shared functionality for building and sending GA4 /collect requests.
 * It reads from GTM's internal state (google_tag_data, google_tag_manager) when available
 * to ensure parameters match what native GTM would send.
 */

// Standard GA4 item parameter mappings
const STANDARD_ITEM_KEYS: Record<string, string> = {
  item_id: 'id',
  item_name: 'nm',
  affiliation: 'af',
  item_brand: 'br',
  item_variant: 'va',
  item_category: 'ca',
  item_category2: 'c2',
  item_category3: 'c3',
  item_category4: 'c4',
  item_category5: 'c5',
  location_id: 'lo',
  price: 'pr',
  quantity: 'qt',
  coupon: 'cp',
  discount: 'ds',
  index: 'lp',
  item_list_id: 'li',
  item_list_name: 'ln',
};

// GA4 Measurement ID - should match your configuration
const GA4_MEASUREMENT_ID = 'G-52LKG2B3L1';
const GTM_CONTAINER_ID = 'GTM-T5GF7DB';

/**
 * Serialize an ecommerce item to GA4 format with custom parameter support
 */
export const serializeItem = (item: any): string => {
  const parts: string[] = [];
  let customIdx = 0;

  for (const [key, value] of Object.entries(item)) {
    if (value === undefined || value === '' || value === null) continue;

    if (STANDARD_ITEM_KEYS[key]) {
      parts.push(`${STANDARD_ITEM_KEYS[key]}${value}`);
    } else if (!key.startsWith('_') && typeof value !== 'object') {
      // Custom parameter - use k{n}key~v{n}value format
      parts.push(`k${customIdx}${key}~v${customIdx}${value}`);
      customIdx++;
    }
  }

  return parts.join('~');
};

/**
 * Build the gcd (Google Consent Default) string from consent entries
 */
const buildGcdString = (entries: any): string => {
  const getConsentChar = (entry: any) => {
    if (!entry) return 'l';
    if (entry.granted === true) return '1';
    if (entry.denied === true) return '3';
    return 'l'; // implicit/not set
  };

  // gcd format: prefix + consent states
  return (
    '13' +
    getConsentChar(entries.ad_storage) +
    getConsentChar(entries.analytics_storage) +
    getConsentChar(entries.ad_user_data) +
    getConsentChar(entries.ad_personalization) +
    'l1l1'
  );
};

/**
 * Extract parameters from GTM's internal state
 */
const getGTMInternalParams = (win: any): Record<string, string> => {
  const params: Record<string, string> = {};
  const gtd = win.google_tag_data;
  const gtm = win.google_tag_manager;

  if (!gtd) return params;

  // User Agent Client Hints from google_tag_data.uach
  const uach = gtd.uach;
  if (uach) {
    if (uach.architecture) params.uaa = uach.architecture;
    if (uach.bitness) params.uab = uach.bitness;
    if (uach.platform) params.uap = uach.platform;
    if (uach.platformVersion) params.uapv = uach.platformVersion;
    params.uaw = uach.mobile ? '1' : '0';
    params.uamb = uach.mobile ? '1' : '0';
    if (uach.model !== undefined) params.uam = uach.model;

    if (uach.fullVersionList && Array.isArray(uach.fullVersionList)) {
      params.uafvl = uach.fullVersionList
        .map((b: any) => `${encodeURIComponent(b.brand)};${b.version}`)
        .join('|');
    }
  }

  // Privacy Sandbox CDL
  if (gtm?.pscdl) {
    params.pscdl = gtm.pscdl;
  }

  // Tag experiments from tidr and xcd
  const experiments: (string | number)[] = [];
  try {
    const loadExp = gtd.tidr?.container?.[GA4_MEASUREMENT_ID]?.context?.loadExperiments;
    if (Array.isArray(loadExp)) {
      experiments.push(...loadExp);
    }

    const pageExp = gtd.xcd?.page_experiment_ids?.get?.();
    if (pageExp?.exp) {
      Object.keys(pageExp.exp).forEach((id) => experiments.push(id));
    }
  } catch {
    // Ignore errors reading experiments
  }

  if (experiments.length) {
    params.tag_exp = [...new Set(experiments.map(String))].join('~');
  }

  // Consent state -> gcd parameter
  const ics = gtd.ics?.entries;
  if (ics) {
    params.gcd = buildGcdString(ics);
  }

  return params;
};

/**
 * Build the gtm version parameter from container info
 */
const buildGtmParam = (win: any): string => {
  const base = '45je61d1';
  try {
    const tidr = win.google_tag_data?.tidr?.container;
    const ga4Container = tidr?.[GA4_MEASUREMENT_ID];
    const gtmContainer = tidr?.[GTM_CONTAINER_ID];

    if (ga4Container?.canonicalContainerId) {
      let gtmParam = base + 'v8' + ga4Container.canonicalContainerId;
      if (gtmContainer?.canonicalContainerId) {
        gtmParam += 'z8' + gtmContainer.canonicalContainerId;
      }
      return gtmParam;
    }
  } catch {
    // Ignore errors
  }
  return base;
};

/**
 * Extract client ID from _ga cookie
 */
const getClientId = (cookies: string): string => {
  const gaCookie = cookies.match(/_ga=([^;]+)/)?.[1];
  return gaCookie?.split('.')?.slice(-2)?.join('.') || 'fallback.' + Date.now();
};

/**
 * Extract session info from _ga_XXXXX cookie
 */
const getSessionInfo = (cookies: string): { sid: string; sct: string } => {
  const sessionCookiePattern = new RegExp(`_ga_${GA4_MEASUREMENT_ID.replace('G-', '')}=([^;]+)`);
  const sessionCookie = cookies.match(sessionCookiePattern)?.[1];

  if (sessionCookie) {
    // Format: GS2.1.s{timestamp}$o{count}$g{engaged}$t{timestamp}...
    const sidMatch = sessionCookie.match(/\.s(\d+)/);
    const sctMatch = sessionCookie.match(/\$o(\d+)/);

    return {
      sid: sidMatch?.[1] || Date.now().toString(),
      sct: sctMatch?.[1] || '1',
    };
  }

  return {
    sid: Date.now().toString(),
    sct: '1',
  };
};

/**
 * Build and send a GA4 /collect request
 */
export const sendGA4Collect = (
  win: any,
  eventName: string,
  eventParams: any,
  options?: {
    isPageView?: boolean;
  }
): void => {
  try {
    const doc = win.document;
    const nav = win.navigator;
    const cookies = doc?.cookie || '';

    const clientId = getClientId(cookies);
    const sessionInfo = getSessionInfo(cookies);
    const screenRes = `${win.screen?.width || 1920}x${win.screen?.height || 1080}`;

    // Get window init time for timing calculations
    const windowInitTime = win._ptInitTime || 0;
    const now = Date.now();

    // Build base parameters
    const params = new URLSearchParams({
      v: '2',
      tid: GA4_MEASUREMENT_ID,
      gtm: buildGtmParam(win),
      _p: now.toString(),
      cid: clientId,
      ul: nav?.language?.toLowerCase() || 'en-us',
      sr: screenRes,
      _s: '1',
      sid: sessionInfo.sid,
      sct: sessionInfo.sct,
      seg: '1',
      dl: doc?.location?.href || '',
      dt: doc?.title || '',
      en: eventName,
    });

    // Add GTM internal parameters (uach, tag_exp, gcd, pscdl, etc.)
    const gtmParams = getGTMInternalParams(win);
    for (const [key, value] of Object.entries(gtmParams)) {
      if (value) params.set(key, value);
    }

    // Add simple flags
    params.set('npa', '0');
    params.set('dma', '0');
    params.set('are', '1');
    params.set('frm', '0');

    // Add timing parameters
    if (windowInitTime > 0) {
      const eventTime = now - windowInitTime;
      params.set('_et', eventTime.toString());
      params.set('tfd', eventTime.toString());
    }

    // Add referrer for page_view
    if (options?.isPageView && doc?.referrer) {
      params.set('dr', doc.referrer);
    }

    // Handle page-specific parameters
    if (eventName === 'page_view') {
      if (eventParams?.page_location) params.set('dl', eventParams.page_location);
      if (eventParams?.page_title) params.set('dt', eventParams.page_title);
      if (eventParams?.page_referrer) params.set('dr', eventParams.page_referrer);
    }

    // Add ecommerce items
    const ecommerce = eventParams?.ecommerce || eventParams;
    if (ecommerce?.items && Array.isArray(ecommerce.items)) {
      ecommerce.items.forEach((item: any, idx: number) => {
        const serialized = serializeItem(item);
        if (serialized) {
          params.set(`pr${idx + 1}`, serialized);
        }
      });
    }

    // Add value and currency
    const value = ecommerce?.value || eventParams?.value;
    const currency = ecommerce?.currency || eventParams?.currency;
    if (value !== undefined) {
      params.set('epn.value', value.toString());
    }
    if (currency) {
      params.set('cu', currency);
    }

    // Send the request
    const collectUrl = `https://analytics.google.com/g/collect?${params.toString()}`;

    fetch(collectUrl, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      credentials: 'include',
    });
  } catch {
    // Silently fail - GTM may still process the event
  }
};

/**
 * Standard GA4 ecommerce events that should be sent via Measurement Protocol
 */
export const GA4_ECOMMERCE_EVENTS = [
  'page_view',
  'view_item',
  'add_to_cart',
  'begin_checkout',
  'purchase',
  'session_start',
  'add_to_card',
  'first_purchase',
  'proceed_to_payment',
  'view_search_results',
];

/**
 * Setup history change listeners for SPA navigation
 * This ensures page_view fires on every URL change (like native GTM behavior)
 */
export const setupHistoryChangeListener = (win: any): void => {
  if (win._ptHistoryListenerSetup) return;
  win._ptHistoryListenerSetup = true;

  let lastUrl = win.location?.href || '';

  const sendPageViewIfUrlChanged = () => {
    const currentUrl = win.location?.href || '';
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      // Small delay to let the page update title etc.
      setTimeout(() => {
        sendGA4Collect(win, 'page_view', {}, { isPageView: true });
      }, 50);
    }
  };

  // Listen for popstate (back/forward navigation)
  win.addEventListener('popstate', sendPageViewIfUrlChanged);

  // Wrap history.pushState
  const originalPushState = win.history?.pushState;
  if (originalPushState) {
    win.history.pushState = function (...args: any[]) {
      const result = originalPushState.apply(this, args);
      sendPageViewIfUrlChanged();
      return result;
    };
  }

  // Wrap history.replaceState
  const originalReplaceState = win.history?.replaceState;
  if (originalReplaceState) {
    win.history.replaceState = function (...args: any[]) {
      const result = originalReplaceState.apply(this, args);
      sendPageViewIfUrlChanged();
      return result;
    };
  }
};
