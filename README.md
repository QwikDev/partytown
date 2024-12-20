# Partytown 🎉

<img width="838" alt="Partytown github fit 2x" src="https://user-images.githubusercontent.com/452425/134568488-f36f4640-9ada-4a78-a969-2b8315cf7f47.png">

- [Introducing Partytown: Run Third-Party Scripts From a Web Worker](https://dev.to/adamdbradley/introducing-partytown-run-third-party-scripts-from-a-web-worker-2cnp)
- [How Partytown's Sync Communication Works](https://dev.to/adamdbradley/how-partytown-s-sync-communication-works-4244)
- [How we cut 99% of our JavaScript with Qwik + Partytown](https://www.builder.io/blog/how-we-cut-99-percent-js-with-qwik-and-partytown)
- [Partytown is now in Beta](https://www.builder.io/blog/partytown-is-now-in-beta)

> A fun location for your third-party scripts to hang out

Partytown is a lazy-loaded library to help relocate resource intensive scripts into a [web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API), and off of the [main thread](https://developer.mozilla.org/en-US/docs/Glossary/Main_thread). Its goal is to help speed up sites by dedicating the main thread to your code, and offloading third-party scripts to a web worker.

> Note: Partytown is still in beta and not guaranteed to work in every scenario. Please see our [FAQ](https://partytown.qwik.dev/faq) and [Trade-Off](https://partytown.qwik.dev/trade-offs) sections for more info.

The philosophy is that the main thread should be dedicated to your code, and any scripts that are not required to be in the [critical path](https://developers.google.com/web/fundamentals/performance/critical-rendering-path) should be moved to a web worker. Main thread performance is, without question, more important than web worker thread performance.

- [Getting Started](https://partytown.qwik.dev/getting-started)
- [Integrations](https://partytown.qwik.dev/integrations)
- [Configuration](https://partytown.qwik.dev/configuration)
- [Releases](https://github.com/BuilderIO/partytown/releases)
- [FAQs](https://partytown.qwik.dev/faq)

![Without Partytown and With Partytown: Your code and third-party code compete for main thread resources](https://user-images.githubusercontent.com/452425/152393346-6f721a4f-3f66-410a-8878-a2b49e24307f.png)

## Community

- [@QwikDev](https://twitter.com/QwikDev)
- [@Builderio](https://twitter.com/builderio)
- [Local Development](https://github.com/BuilderIO/partytown/blob/main/CONTRIBUTING.md#local-development)
- [For Plugin Authors / Developers](https://github.com/BuilderIO/partytown/blob/main/CONTRIBUTING.md#plugin-authors-developers)

## Related Projects

- [Qwik](https://github.com/BuilderIO/qwik): An open-source framework designed for best possible time to interactive, by focusing on resumability of server-side-rendering of HTML, and fine-grained lazy-loading of code.
- [Mitosis](https://github.com/BuilderIO/mitosis): Write components once, run everywhere. Compiles to Vue, React, Solid, Angular, Svelte, and more.
- [Builder](https://github.com/BuilderIO/builder): Drag and drop page builder and CMS for React, Vue, Angular, and more.

<br>
<br>
<p align="center">
   <a href="https://www.builder.io/m/developers">
      <picture>
         <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/844291/230786554-eb225eeb-2f6b-4286-b8c2-535b1131744a.png">
         <img width="250" alt="Made with love by Builder.io" src="https://user-images.githubusercontent.com/844291/230786555-a58479e4-75f3-4222-a6eb-74c5af953eac.png">
       </picture>
   </a>
</p>
