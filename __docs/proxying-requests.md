---
title: Proxying Requests
---

Often third-party scripts are added to the page by appending a script tag, such as:

```javascript
var script = document.createElement('script');
script.url = 'http://some-third-party-script.com/tracking.js';
document.head.appendChild(script);
```

When the `<script>` element is appended to the `<head>` using this traditional approach, the script's HTTP response _does not_ require [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) headers.

However, because Partytown requests the scripts within a web worker using [fetch()](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), then the script's response _requires_ the correct CORS headers.

Many third-party scripts already provide the correct CORS headers, but not all do. For services that do not add the correct headers, then a [reverse proxy](#reverse-Proxy) to another domain must be used in order to provide the CORS headers.

#### CORS Response Header

```
Access-Control-Allow-Origin: *
```

## Configuring URL Proxies

When executed from within Partytown, every URL is resolved by Partytown, which also gives users the ability to inspect and modify any and every URL being resolved. The `resolveUrl()` config can be used to check for a specific URL, and optionally return the proxied URL instead. For example, in the code below we're checking if the URL to be resolved is for Google Analytics, and if so, return a different URL that points to a [reverse proxy](#reverse-Proxy).

### Vanilla Config Example

```javascript
partytown = {
  resolveUrl: function (url, location, type) {
    if (type === 'script') {
      var proxyUrl = new URL('https://my-reverse-proxy.com/');
      proxyUrl.searchParams.append('url', url.href);
      return proxyUrl;
    }
    return url;
  },
};
```

Please see the [integration guides](/integrations) and [configuration](/configuration) for more information.

## Reverse Proxy

Below are a few examples of [reverse proxies](https://en.wikipedia.org/wiki/Reverse_proxy) that could be used.

- [Apache](https://httpd.apache.org/docs/2.4/howto/reverse_proxy.html)
- [AWS: Creating a Reverse Proxy for Partytown with AWS Cloudfront](https://nystudio107.com/blog/creating-a-reverse-proxy-for-partytown-with-aws-cloudfront)
- [Cloudflare](https://www.cloudflare.com/learning/cdn/glossary/reverse-proxy/)
- [Gatsby Cloud: Redirects and Rewrites](https://support.gatsbyjs.com/hc/en-us/articles/1500003051241-Working-with-Redirects)
- [Netlify: Proxy to another service](https://docs.netlify.com/routing/redirects/rewrites-proxies/#proxy-to-another-service)
- [NGINX](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Vercel: Rewrites](https://vercel.com/docs/cli#project-configuration/rewrites)


## Serving Resources Locally

Another option to work around the `Access-Control-Allow-Origin` issue _without_ using a proxy is to serve your third-party JavaScript and other resources locally.

So instead of inserting something like this on your page for [Google Analytics](https://developers.google.com/analytics/devguides/collection/analyticsjs):

```html
<!-- Google Analytics -->
<script type="text/partytown">
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-XXXXX-Y', 'auto');
  ga('send', 'pageview');
</script>
<!-- End Google Analytics -->
```

You instead download the `analytics.js` JavaScript resource, and serve it locally from your domain like this:

```html
<!-- Google Analytics -->
<script type="text/partytown">
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://example.com/analytics.js','ga');

  ga('create', 'UA-XXXXX-Y', 'auto');
  ga('send', 'pageview');
</script>
<!-- End Google Analytics -->
```

Since you are serving the resource from your own server, you control the headers that come along with it, including the `Access-Control-Allow-Origin` header that the proxy work-around is sometimes needed for.

As a bonus, serving these resources locally is one less DNS lookup that needs to happen before the client can load your site.

You can manually download these self-hosted third-party JavaScript resources, or you can use a webpack plugin like [save-remote-file-webpack-plugin](https://www.npmjs.com/package/save-remote-file-webpack-plugin) to do it as part of your build process:

```js
const SaveRemoteFilePlugin = require('save-remote-file-webpack-plugin');
module.exports = {
  plugins: [
    new SaveRemoteFilePlugin([
      {
        url: 'https://google-analytics.com/analytics.js',
        filepath: 'js/analytics.js',
      },
    ]),
  ],
};
```
