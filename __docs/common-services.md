---
title: Common Services
---

Partytown is built with the goal that any third-party script can be ran from within it. At the lowest level, any script can add the `type="text/partytown"` attribute to have it executed from a web worker.

Below is a list of plugins / libraries that are tested & known to be working with Partytown with their commonly used [forward configs](/forwarding-events) and [proxied domains](/proxying-requests).

| Service                                                                                       | Forward Config                                                                | Proxy Domain                                        |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------- |
| [Facebook Pixel](/facebook-pixel)                                                             | "fbq"                                                                         | "connect.facebook.net"                              |
| [Google Tag Manager](/google-tag-manager)                                                     | "dataLayer.push"                                                              |                                                     |
| [Hubspot Tracking](https://developers.hubspot.com/docs/api/events/tracking-code)              | "\_hsq.push"                                                                  |                                                     |
| [Intercom](https://developers.intercom.com/installing-intercom/docs/intercom-javascript)      | "Intercom"                                                                    |                                                     |
| [Klaviyo](https://developers.klaviyo.com/en/docs/javascript-api)                              | "\_learnq.push"                                                               | "static.klaviyo.com", "static-tracking.klaviyo.com" |
| [TikTok Pixel](https://ads.tiktok.com/marketing_api/docs?rid=959icq5stjr&id=1701890973258754) | "ttq.track", "ttq.page", "ttq.load"                                           |
| [Mixpanel](https://developer.mixpanel.com/docs/javascript-quickstart)                         | "mixpanel.track"                                                              |                                                     |

If you would like to add to this list,

- Refer to the ["for Plugin Authors / Developers"](https://github.com/BuilderIO/partytown/blob/main/CONTRIBUTING.md#plugin-authors--developers) section to see how you can validate whether a library / plugin works with Partytown.
- Send us a PR so that we can have a scenario checked in that validates it.
- Please [edit this doc](https://github.com/BuilderIO/partytown/edit/main/docs/common-services.md) to add your plugin / library and its configuration so that others can start using it!
