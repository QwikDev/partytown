---
title: Sandboxing
---

Third-party scripts are often a black-box with large amounts of code. What's buried within the obfuscated code is difficult to tell. It's minified for good reason, but regardless it becomes very difficult to understand what third-party scripts are executing on _your_ site and _your_ user's devices.

Partytown on the other hand, is able to isolate and sandbox third-party scripts within a web worker, and allow, or deny, access to main thread APIs. This includes cookies, localStorage, or the entire document. Because the code is executed within the worker, and their access to the main thread _must_ go through the proxy, Partytown is able to give developers control over what the scripts can execute.

Essentially, Partytown lets you:

- Isolate third-party scripts within a sandbox ([web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)).
- Configure which browser APIs specific scripts can, and cannot, execute.
- Option to log API calls and passed in arguments in order to give better insight as to what the scripts are doing.
