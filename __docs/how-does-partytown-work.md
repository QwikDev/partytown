---
title: How Does Partytown Work
---

- [How Partytown's Service Worker Sync Communication Works](https://dev.to/adamdbradley/how-partytown-s-sync-communication-works-4244)

Traditionally, communicating between the main thread and worker thread _must_ be [asynchronous](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Concepts). Meaning that for the two threads to communicate, they cannot use blocking calls.

Partytown is different. It allows code executed from the web worker to access DOM _synchronously_. The benefit from this is that third-party scripts can continue to work exactly how they're coded.

For example, the code below works as expected within a web worker:

```javascript
const rect = element.getBoundingClientRect();
console.log(rect.x, rect.y);
```

First thing you'll notice is that there's no async/await, promise or callback. Instead, the call to `getBoundingClientRect()` is blocking, and the returned `rect` value contains the expected `x` and `y` properties.

Partytown relies on [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API), [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), [JavaScript Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), and a communication layer between them all.

There are currently two ways to communicate synchronously between the web worker and main thread, and that's sync xhr requests combined with Service Workers, and Atomics.

## Designating Web Worker Scripts

It's important to note that Partytown does not automatically move all scripts to the web worker, but prefers an opt-in approach. Meaning, it's best that the developer can pick and choose exactly which scripts should use Partytown, while all the others would go unchanged. Please see the [Partytown Scripts](/partytown-scripts) for more info.

Partytown is only enabled for specific scripts when they have the `type="text/partytown"` attribute. This `type` attribute does two things:

1. Prevent the main thread from executing the script.
2. Provides a selector for Partytown to query, such as `document.querySelectorAll('script[type="text/partytown"]')`

### Adding Partytown Attribute

Below is an example of adding the `type="text/partytown"` attribute to an existing `<script>`.

```diff
- <script>...</script>
+ <script type="text/partytown">...</script>
```

## Service Worker

1. Scripts are disabled from running on the main thread by using the `type="text/partytown"` attribute on the `<script/>` tag.
1. Service worker creates an `onfetch` handler to intercept specific requests.
1. Web worker is given the scripts to execute within the worker thread.
1. Web worker creates JavaScript Proxies to replicate and forward calls to the main thread APIs (such as DOM operations).
1. Any call to the JS proxy uses [_synchronous_ XHR](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Synchronous_and_Asynchronous_Requests#example_http_synchronous_request) requests.
1. Service worker intercepts requests, then is able to asynchronously communicate with the main thread.
1. When the service worker receives the results from the main thread, it responds to the web worker's request.
1. From the point of view of code executing on the web worker, everything was synchronous, and each call to the document was blocking.

## Atomics

Please see the [Atomics communication layer docs](/atomics) on how to enable them. When Atomics are not enabled, the fallback is to use the Service Worker instead. In the end, Atomics are preferred because they're roughly 10x faster in transfering data between the web worker and main thread.

1. Scripts are disabled from running on the main thread by using the `type="text/partytown"` attribute on the `<script/>` tag.
1. Main thread detects Atomics communication can be used, and loads the Atomics build instead of the Service Worker build.
1. Web worker is given the scripts to execute within the worker thread.
1. Web worker creates JavaScript Proxies to replicate and forward calls to the main thread APIs (such as DOM operations).
1. Any call to the JS proxy will use [Atomics.store()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/store) and `postMessage()` to send the data to the main thread, and run [Atomics.wait()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/wait).
1. [Atomics.load()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/load) is used once the web worker receives the results data from the main thread.
1. From the point of view of code executing on the web worker, everything was synchronous, and each call to the document was blocking.

## Serialization

Data passed between the main thread and web worker must be [serializable](https://en.wikipedia.org/wiki/Serialization). Partytown automatically handles the serializing and deserializing of data passed between threads. This works for primitive values, such as a `string`, `boolean` or `number`, and also functions, which get unique IDs assigned that are passed to the opposite thread and can be called.
