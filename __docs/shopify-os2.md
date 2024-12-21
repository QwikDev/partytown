---
title: Shopify OS 2.0
---

Shopify OS 2.0 frontends are built with the Liquid templating language. Since it compiles to HTML, the [HTML integration guide](./html) is a good starting point. There are however a few platform based challenges and limitations you have to work around.

## Theme Files & Partydawn

The integration of Partytown largely depends on the theme you're using and the structure of its files. It's impossible to cover all different cases and you'll need to figure stuff out based on the examples given on this page. This should be viewed more as a template and not a full guide.

Shown code and steps are based on [Partydawn](https://github.com/j0Shi82/shopify-partydawn), an example of Shopify's Dawn theme that integrates Partytown.

## Requirements

- You need to be able to [set up an app proxy](https://github.com/edlaver/cloudflare-worker-partytown-shopify-app-proxy/tree/main) that can serve partytown assets
- Learn the basics of [Shopify Web Pixels](https://shopify.dev/docs/apps/marketing/pixels)

### Can't Hurt

- [Shopify's Customer Privacy API](https://shopify.dev/docs/api/consent-tracking)
- Experience with cookie consent management
- Make yourself comfortable with your theme's structure and file system

## Install

In the root file of your theme, add the Partytown snippet and config object. This most likely is the file that contains the `{{ contents_for_header }}` variable.

```html
<script>
  window.partytown = {
    forward: ['dataLayer.push' /**, ... */],
    // you cannot host partytown within Shopify OS 2.0
    // so you need to proxy assets
    resolveUrl: function (url, location, type) {
      if (type === 'script' /** extend as needed */) {
        const proxyUrl = new URL('/apps/partytown/proxy', location.href);
        proxyUrl.searchParams.append('url', url.href);
        return proxyUrl;
      }
      return url;
    };
  };
</script>
<script>
  /* Inlined Partytown Snippet */
</script>
```

It's important to understand that you cannot host Partytown assets on Shopify OS 2.0. So your app [proxy](./proxying-requests) needs to serve them.

Then add the `type="text/partytown"` attribute for each script that should run from the web worker as usual.

## Hooking Into the Web Pixel

Tracking events in Shopify isn't as straight forward as with other integrations. The checkout is fully controlled by Shopify, meaning you cannot fire some important events manually (`purchase`). Additionally some customization to your theme has to be done to find the right places to track `cart` events etc. The easiest way to deal with tracking in Shopify is through Web Pixels, which offer an API to hook into Shopify's own event stream.

You however cannot get Partytown to work inside Web Pixels because it's a sandboxed environment in an iframe without access to the top frame. To install the Tag Manager inside a Pixel you can follow [the official documentation](https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels/gtm-tutorial). The approach should be similar with other vendors.

The only exception is that you don't want to load the tracking scripts directly in the sandbox. Instead we inject the script as `text/partytown` in the regular page and create an event bridge between the Pixel and the main page using the `sessionStorage` that is available in the Pixel. We push events to the storage, pick them up on the main page, and forward them to Partytown.

```js
// inside the Pixel
browser.sessionStorage.setItem(`pt_dl_` + inc++, JSON.stringify(data));

// on the main page
function isSessionStorageAvailable() {
  var test = 'test';
  try {
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

if (isSessionStorageAvailable()) {
  var inc = 0;
  window.setInterval(function () {
    while (sessionStorage.getItem('pt_dl_' + inc) !== null) {
      window.dataLayer.push(JSON.parse(sessionStorage.getItem('pt_dl_' + inc)));
      sessionStorage.removeItem('pt_dl_' + inc);
      inc++;
    }
    // adjust the interval as you see fit
  }, 1000);
}
```

In case sessionStorage is not available, the Pixel should install the tracking scripts conventionally. This also has to be done on checkout pages which don't work with Partytown. You have all the tools inside Pixels to perform these checks and operations.

You can certainly also use `window.postMessage` to build an event bridge between the Web Pixel (iframe) and the top frame. But `sessionStorage` is directly supported by the Web Pixel API.

## Tracking Outside the Web Pixels

You can still implement manual tracking outside Web Pixels. In that case you need to add additional tracking inside `Settings-> Checkout -> Order Status Page Additional Scripts` to track purchases and conversions. Please note that this is deprecated. The current deadline is August 28, 2025. Although Shopify has pushed it back multiple times, you will eventually have to switch to Web Pixels or [Checkout Extensions](https://shopify.dev/docs/api/checkout-extensions).

## Use the Mutation Observer to Move Scripts into the Worker

Unfortunately you don't have full control over all scripts that are injected into the site. Some stuff will get added by Shopify automatically. We can thankfully still manipulate inline scripts using a [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver). Changing the type to text/partytown will prevent script execution and the script will instead be processed by Partytown.

This way you can offload Shopify's own `trekkie` tracking and run the standard integrations for [Google Analytics](https://help.shopify.com/en/manual/reports-and-analytics/google-analytics/google-analytics-setup) and [Facebook](https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-pixel) through Partytown.
