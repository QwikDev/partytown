---
title: Trade-Offs
---

Nothing is without trade-offs. Using Partytown to orchestrate third-party scripts vs. adding them to your pages the traditional way has the following considerations:

## Intercepted Network Requests

You'll notice in the network tab there may be hundreds of requests to `proxytown`. Even though these requests are listed in the network tab, each of these are intercepted by the service worker and handled by Partytown locally, and they are not external HTTP requests. Using these locally intercepted network requests is how the [service worker communication layer](/how-does-partytown-work#service-worker) is able to work.

These requests showing up are more of an annoyance than anything else, since they shouldn't be affecting performance or [Lighthouse scores](https://web.dev/performance-scoring/). Additionally, they can give you an insight into what certain third-party scripts are up to. See the [debugging documentation](/debugging) for more info.

## Throttled DOM Operations

DOM operations within the worker are purposely throttled, slowing down their execution compared to the same code running on the main thread. (We also see this as a feature.) Because their code is running in another thread and needs to send and receive data between the two, it may take a few milliseconds to perform a blocking operation. This ties into why [UI intensive scripts](#ui-intensive-third-party-scripts) may not be the best fit for Partytown.

Partytown does however batch most operations together to reduce the calls between threads.

## UI Intensive Third-Party Scripts

For a third-party script that is UI intensive, meaning the script builds up a mini-app within your page, Partytown may not be best suited for that script. For example, the third-party script may popup a dialog with a form inside of it.

Every script is different, and each are performing operations in different ways, so it's difficult to state exactly which services do and do not work well with Partytown. While Partytown may work great for some UI implementations, it may not work well for others. For this reason, Partytown is opt-in, and you can explicitly set which scripts to use it on.

Partytown is best suited for third-party scripts such as Google Tag Manager or Facebook Pixel, since they're only handling user events and lazily posting data to their services in the background. Third-party scripts that insert a large amount of DOM nodes to a page may not be the best candidates.

## Third-Party Scripts Without CORS Headers

While most third-party scripts add the correct [Cross-Origin Resource Sharing (CORS) headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS), such as `Access-Control-Allow-Origin: *`, not all do. Please see the [Proxying Requests](/proxying-requests) documentation on how to use Partytown with any services that do not add the correct headers.

## Events Cannot Prevent Default

Events handled by third-party scripts that call `event.preventDefault()` will have no effect. Partytown is able to be blocking when the code is ran within the web worker, but not in the other direction.

For example, when a user clicks a link on the main thread, a third-party script may have an event handler on that same link, which may have [event.preventDefault()](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault). By the time the web worker receives an event that the link was clicked, it is no longer a synchronous operation and calling `preventDefault()` has no effect. As a side note, you could also see this as a feature when third-party scripts are abusing `scroll` events without using passive event listeners.

## Cross-Origin IFrame Cookies And Storage

If an iframe was created with Partytown, and the _iframe is cross-origin_, then Partytown is unable to get or set the origin's `document.cookie`, `localStorage` or `sessionStorage`. The code will continue to work, however, cookies and storage will not persist.

Setting `document.cookie` is a noop and will not assign anything, and getting a cookie will always return an empty string. Both `localStorage` and `sessionStorage` work as expected, however, the `localStorage` data is not saved across browser sessions. In these scenarios a `console.warn` will be logged.

Note this is only an issue for iframes, created from within a Partytown script, and the created iframe is cross-origin. Partytown scripts, and iframes that have the same origin, do not have this issue.

## Service Worker

For the Service Worker build, a total of three threads are used: Main Thread, Web Worker, and Service Worker. Note that the [Atomics](/atomics) build only uses two threads.

## Not Always The Best Fit

While Partytown works great for some third-party scripts, it may not be the best fit for every single script out there (and that's ok). For example, some third-party scripts have a `setInterval()` loop that continually reads through the entire `document` every X milliseconds. This is just bad practice to begin with, but when these scripts are run from Partytown then it's visible that Partytown is overworked trying to keep up the script's layout thrashing code. Since every script is different, it's difficult to state exactly which scripts do and do not work well with Partytown. For this reason, Partytown is opt-in, and you can explicitly set which scripts to use it on.
