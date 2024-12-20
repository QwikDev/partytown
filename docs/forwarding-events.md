---
title: Forwarding Events And Triggers
---

Many third-party scripts add a global variable to `window` which user code calls in order to send data to the service. For example, Google Tag Manager uses a [Data Layer](https://developers.google.com/tag-manager/devguide) array, and by pushing data to the array, the data is then sent on to GTM Servers. Because we're moving third-party scripts to a web worker, the main thread needs to know which variables to patch on `window`, and when these services are called, the data is correctly forwarded to the web worker. This includes queuing any events that may have happened before Partytown has even finished initializing.

For example, Google Tag Manager adds the `dataLayer` array to `window`, and Facebook Pixel adds the `fbq` function. Below is some quick pseudo code of what they're doing:

```js
// Google Tag Manager
window.dataLayer = [];

// Facebook Events
window.fbq = function(){...};
```

Because GTM and Facebook Pixel objects are added immediately in the `<head>` by each service, then anywhere within the webpage, your code and their code, can safely call `dataLayer.push(...)` or `fbq(...)`.

However, since GTM and Facebook Pixel were actually loaded in the web worker, then we need to forward these calls. The `forward` config is used to set which `window` variables should be patched and forwarded on. The forward string value is of the function to call, and since GTM is pushing to an array, the function to call is `dataLayer.push`.

```js
<script>
  partytown = {
    forward: ['dataLayer.push', 'fbq']
  };
</script>
```

Notice the forward configs are just strings, not actual objects. We're using strings here so we can easily serialize what service variable was called, along with the function argument values. When the web worker receives the information, it then knows how to correctly apply the call and arguments that were fired from the main thread.

You can customize each forwarded variable with the following settings:

- ### preserveBehavior

  In addition to the `forward` config, we also provide a `preserveBehavior` property. This property allows you to customize each forwarded property, preserving the original behavior of the function.

  When `preserveBehavior` is set to `true`, the original function's behavior on the main thread is maintained, while also forwarding the calls to partytown. This is useful in cases where the function has side effects on the main thread that you want to keep.

  If `preserveBehavior` is not explicitly set, its default value is `false`. This means that, by default, calls will only be forwarded to partytown and won't execute on the main thread.

  Here's an example of how to use it:

  ```js
  <script>
    partytown = {
      forward: [
        ['dataLayer.push', { preserveBehavior: true }],
        ['fbq', { preserveBehavior: false }],
        'gtm.push'
      ]
    };
  </script>
  ```

  In this example, calls to `dataLayer.push` will execute as normal on the main thread and also be forwarded to partytown. Calls to `fbq` will only be forwarded to partytown, and won't execute on the main thread. For `gtm.push`, since preserveBehavior is not explicitly set, it will behave as if preserveBehavior was set to false, meaning it will only be forwarded to partytown.

## Integrations

Please see the [Integrations](/integrations) section for examples using the `forward` config.

## Common Services

Please see the [Common Services](/common-services) section for a list of known configs for various services.
