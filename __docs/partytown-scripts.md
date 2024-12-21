---
title: Partytown Scripts
---

## Partytown Script Type

Add the `type="text/partytown"` attribute to each individual third-party script to run from a web worker. Note that each script is opt-in, meaning that the updated `type` attribute should only be added to scripts that should run with Partytown. Partytown will _not_ automatically upgrade any scripts unless this attribute is added.

```diff
- <script>...</script>
+ <script type="text/partytown">...</script>
```

## Why `type="text/partytown"`?

The `type="text/partytown"` attribute does two things:

1. Informs the browser to _not_ process the script. By giving the script a [type attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-type) which the browser does not recognize: "The embedded content is treated as a data block which won't be processed by the browser."
2. Provides a query selector so Partytown can find all the scripts to run from within the web worker. When the document is ready and Partytown has initialized, Partytown will then query selector for all of the `script[type="text/partytown"]` script elements. You'll notice that after a script has been executed in the web worker, it'll then get an updated type attribute of `type="text/partytown-x"`.

## Dynamically Appending Scripts

Commonly, scripts will already be a part of the DOM when the document loads, and once the document is ready and the window has loaded, Partytown will find the scripts and start executing them in the web worker. However, if a script is dynamically appended to the DOM, _after_ Partytown has initialized, you can still dispatch the `ptupdate` custom event on window to notify Partytown there are new scripts to find.

Below is an example of dynamically appending a script to the document, then notifying Partytown to run its update again. Notice that _before_ the script is appended, the `type` property (or attribute) is already set to `text/partytown`.

```js
const script = document.createElement('script');
script.type = 'text/partytown';
script.innerHTML = `console.log("New partytown script!")`;
document.head.appendChild(script);

window.dispatchEvent(new CustomEvent('ptupdate'));
```

## Integrations

Please see the [integration guides](/integrations) for more information on how to setup Partytown.
