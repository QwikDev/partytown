---
'@qwik.dev/partytown': minor
---

feat: Add an opt-in native iframe boundary for browser-owned service workers.

Use `loadIframesOnMainThread: (url) => url.origin === 'https://example.com' && url.pathname === '/sw-frame.html'` to keep selected iframe documents native while their parent script remains in Partytown. This preserves native TrustedScriptURL registration and serviceWorker.ready without shimming either API. The parent-realm sender preserves message source identity; load events, repeated navigation and removal are covered by regression tests.

Selection is sticky for the frame's lifetime. Virtual DOM access to the native document and transferable message ports are not added by this change. Unselected virtual iframes retain their existing behavior, including their existing service-worker API limitations.
