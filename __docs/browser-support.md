---
title: Browser Support
---

Partytown works to ensure that all browsers can still run third-party scripts, whether they have support for service workers, atomics, or neither. This means if you're supporting legacy browsers such as IE11, the scripts should continue to work as if Partytown wasn't being used.

At its core, Partytown uses Service Workers or Atomics to do its synchronous communication from the web worker to the main thread. However, when a browser does not support either of those, it'll fallback to run the scripts the traditional way (the way it works today without Partytown).

## How Feature Support Works

1. Browser checks to see if it has support for [Atomics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics) using the [crossOriginIsolated](https://developer.mozilla.org/en-US/docs/Web/API/crossOriginIsolated) boolean found on `window`.
1. If the browser and site do not have support for Atomics, it'll then check to see if the browser has support for [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API). Currently this is the most commonly used one.
1. If the browser does not have support for Service Workers or Atomics, it'll then find all the `type="text/partytown"` scripts and reset them to be traditional scripts and execute normally.

> Note: Atomics are still experimental, and also require specific server-side response headers for them to work. Please see the [Enabling Atomics](/atomics) section for more info.

## Web API Feature Support

- [Atomics](https://caniuse.com/mdn-javascript_builtins_atomics)
- [JavaScript Proxy](https://caniuse.com/proxy)
- [Service Workers](https://caniuse.com/serviceworkers)
- [Web Workers](https://caniuse.com/webworkers)
