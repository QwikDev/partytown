---
'@qwik.dev/partytown': minor
---

Add `strictProxyHas` configuration option for accurate namespace conflict detection

**Summary:**

This release adds a new configuration option `strictProxyHas` that enables accurate property existence checks using the `in` operator. This is required for scripts like FullStory that check for namespace conflicts when loaded via Google Tag Manager (GTM).

**Key Changes:**

- Add `strictProxyHas?: boolean` config option to enable accurate `in` operator behavior
- Update window proxy's `has` trap to use `Reflect.has()` when `strictProxyHas: true`
- Default is `false` for backwards compatibility
- Add FullStory GTM integration test with production-ready snippet
- Document the configuration and provide usage guide

**Usage:**

```html
<script>
  partytown = {
    forward: ['FS.identify', 'FS.event'],
    strictProxyHas: true  // Enable for FullStory via GTM
  };
</script>
```

**Backwards Compatibility:**

This is a non-breaking change. The default behavior remains unchanged (`strictProxyHas: false`), so existing implementations will continue to work without modifications.
