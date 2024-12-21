import { marked } from 'marked';
import domino from 'domino';
import frontMatter from 'front-matter';
import { mkdir, readdir, readFile, unlink, writeFile } from 'fs/promises';
import { join } from 'path';

const markdownLayout = `../layouts/MainLayout.astro`;
const hasLoaded = new Set();

async function loadDocs() {
  console.log(`📝 Loading Docs...\n`);

  try {
    await mkdir(join('src', 'pages'));
  } catch (e) {}

  const pages = await readdir(join('src', 'pages'));
  await Promise.all(
    pages.map(async (mdFilename) => {
      await unlink(join('src', 'pages', mdFilename));
    })
  );

  const toc = await loadToc();

  await loadContent(toc);

  console.log(`💥 Loaded Docs\n`);
}

async function loadContent(toc) {
  if (Array.isArray(toc)) {
    await Promise.all(
      toc.map(async (c) => {
        if (c && c.filename) {
          const mdFilename = c.filename + '.md';
          if (!hasLoaded.has(mdFilename)) {
            hasLoaded.add(mdFilename);
            const orgContent = await readSourceContent(mdFilename);
            if (orgContent != null) {
              console.log(mdFilename);

              const fmContent = frontMatter(orgContent);
              const content = [`---`];
              if (fmContent.attributes) {
                Object.keys(fmContent.attributes).forEach((attr) => {
                  content.push(`${attr}: ${fmContent.attributes[attr]}`);
                });
              }
              content.push(`layout: ${markdownLayout}`);
              content.push(`---`);
              content.push(``);
              content.push(fmContent.body);

              const outputPath = join('src', 'pages', mdFilename);
              console.log('write', outputPath);
              await writeFile(outputPath, content.join('\n'));
            }
          }

          await loadContent(c.children);
        }
      })
    );
  }
}

async function loadToc() {
  const markdown = await readSourceContent(`_table-of-contents.md`);
  const html = marked(markdown);
  const doc = domino.createDocument(html);
  const toc = [];
  const order = [];

  function getLinks(parentNode, toc) {
    const ul = parentNode && parentNode.querySelector('ul');
    if (ul && ul.children) {
      const childrenNodes = Array.from(ul.children);
      childrenNodes.forEach((childNode) => {
        try {
          const anchor = childNode.querySelector('a');
          if (anchor) {
            const text = anchor.textContent || '';
            const href = anchor.getAttribute('href') || '';
            const filename = href === '/' ? 'index' : href.replace('/', '');
            const children = [];

            const current = {
              text,
              href,
              filename,
              children,
            };
            order.push(current);
            toc.push(current);

            getLinks(childNode, children);
          }
        } catch (e) {
          console.error(e);
        }
      });
    }
  }

  getLinks(doc, toc);

  for (let i = 0; i < order.length; i++) {
    const current = order[i];

    for (let p = i - 1; p >= 0; p--) {
      const previous = order[p];
      if (previous.href !== current.href) {
        current.previous = {
          text: previous.text,
          href: previous.href,
        };
        break;
      }
    }

    for (let n = i + 1; n < order.length; n++) {
      const next = order[n];
      if (next.href !== current.href) {
        current.next = {
          text: next.text,
          href: next.href,
        };
        break;
      }
    }
  }

  const code = `// dynamically generated, see load-docs.mjs \n\nexport const TOC = ${JSON.stringify(
    toc,
    null,
    2
  )};\n`;

  await writeFile('./src/table-of-contents.ts', code);

  return toc;
}

async function readSourceContent(fileName) {
  try {
    const filePath = join('..', fileName);
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (e) {}
  return null;
}

loadDocs();
