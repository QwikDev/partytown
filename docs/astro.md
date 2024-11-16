---
title: Astro
---

There is a first-class [Astro integration for partytown](https://github.com/withastro/astro/tree/main/packages/integrations/partytown).

## Automatic Setup

Astro includes a CLI tool for adding integrations. Using the `astro add` command will automatically install Partytown and configure your project.

```bash
npx astro add partytown
yarn astro add partytown
pnpx astro add partytown
```

## Partytown Script

Add `type: 'text/partytown'` [attribute](/partytown-scripts) to any scripts you want to be handled by Partytown.

```html
<script type="text/partytown" src="https://example.com/analytics.js"></script>
```

Note that the [Astro Partytown](https://github.com/withastro/astro/tree/main/packages/integrations/partytown) integration already handles copying the library files to the correct location.
