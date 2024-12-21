---
title: Google Tag Manager
---

## Add the Google Tag Manager Script

- [Install Google Tag Manager for web pages](https://developers.google.com/tag-platform/tag-manager/web)

## Partytown Script

Set the script element's `type` attribute to `text/partytown`. For example:

```html
  <script type="text/partytown" src="https://www.googletagmanager.com/gtag/js?id=YOUR-ID-HERE"></script>
  <script type="text/partytown">
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'YOUR-ID-HERE');
  </script>
```

## Google Analytics 4 (GA4)

GA4 responses come with the correct CORS headers, so you will not have to [proxy](/proxying-requests) the requests to `www.google-analytics.com`. [Older versions of Google Analytics](https://support.google.com/analytics/answer/11583528?sjid=5512098847312629397-NA) required proxying, but have been sunset by Google and are no longer supported.

## Forward Events

Google Tag Manager uses the [dataLayer](https://developers.google.com/tag-platform/tag-manager/web/datalayer) array to send events. In order for Partytown to forward the calls to `window.dataLayer.push({..})`, the forward config should add `"dataLayer.push"`. Please see [forwarding events and triggers](/forwarding-events) for more information.

## Example Config

```json
{
  "forward": ["dataLayer.push"]
}
```

Please see the [integration docs](/integrations) for framework specific configuration.
