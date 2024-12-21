import fs from 'fs';
import path from 'path';

const list = [
  'angular/index.mdx',
  'astro/index.mdx',
  'atomics/index.mdx',
  'browser-support/index.mdx',
  'common-services/index.mdx',
  'configuration/index.mdx',
  'copy-library-files/index.mdx',
  'debugging/index.mdx',
  'distribution/index.mdx',
  'facebook-pixel/index.mdx',
  'faq/index.mdx',
  'forwarding-events/index.mdx',
  'gatsby/index.mdx',
  'getting-started/index.mdx',
  'google-tag-manager/index.mdx',
  'how-does-partytown-work/index.mdx',
  'html/index.mdx',
  'index/index.mdx',
  'integrations/index.mdx',
  'magento2/index.mdx',
  'nextjs/index.mdx',
  'nuxt/index.mdx',
  'partytown-scripts/index.mdx',
  'proxying-requests/index.mdx',
  'react/index.mdx',
  'remix/index.mdx',
  'sandboxing/index.mdx',
  'shopify-hydrogen/index.mdx',
  'shopify-os2/index.mdx',
  'solid/index.mdx',
  'sveltekit/index.mdx',
  '_table-of-contents/index.mdx',
  'trade-offs/index.mdx',
];

list.forEach((f) => {
  fs.mkdirSync(path.join(process.cwd(), '../docs/src/routes/' + f.split('/')[0]));
  fs.copyFileSync(`./${f.split('/')[0]}.md`, path.join(process.cwd(), '../docs/src/routes/'+f));
});
