# Local Development

Welcome 🎉!! If you've found a bug, or have an idea to add a feature we'd love to hear from you. It may save time to first ping the group on [Partytown's Discord channel](https://discord.gg/aHKdpdWv7a) to talk through any ideas or any issues that may be a bug.

## Installation

```
npm install
npm run dev
```

See the [distribution](https://partytown.qwik.dev/distribution) section about the various files created. Note that both the root directory, and the `tests` directory receive a copy of the build files, such as `tests/~partytown/partytown.js`.

## Submitting Issues And Writing Tests

We need your help! If you found a bug, it's best to create a [Pull Request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request) that replicates the issue using a test page.

- Minimal Reproduction Case: If maintainers and contributors are unable to reproduce the same error, then it makes it very difficult to debug and fix. Any issued opened without a minimal reproduction example will be closed.
- E2E Test: A good example of an End-to-end test is one where the test fails before the fix, and passes after the fix. But also, all the other tests pass too.

In the [tests directory](https://github.com/BuilderIO/partytown/tree/main/tests), copy one of the directories, such as `tests/platform/document`, and recreate the issue you've found.

Follow the [manual testing](#manual-testing) directions on how to start the local dev server. Next, the more you can describe the debug and pin-point the issue the better, and any fixes to the runtime to solve the problem would be awesome. 🎉

If the PR fixes the issue, then creating an [end-to-end test](#e2e-testing) would help ensure no regressions happen over time.

Additionally, Github issues is a place to explain a problem in detail, along with a reproduction case for maintainers. However, Github issues is not the best place to ask how-to questions since project contributors and maintainers don’t have the capacity to debug external websites and the many third-party scripts. Any issues opened asking that are not following these guidelines will be closed.

Please also see the [FAQ section](https://partytown.qwik.dev/faq) for more info

## Plugin Authors / Developers

If you are the author / developer of any 3rd party plugin / library, and want to ensure that your library works with Partytown, we would love to work with you to ensure it does!

The easiest way to verify is to create a small, standalone replica in our [integration tests directory](https://github.com/BuilderIO/partytown/tree/main/tests/integrations). Our standard practice is to:

- Create a `standard.html` which loads your library / plugin as it normally is loaded, as a `<script type="text/javascript">`. This file basically is your normal, happy case, with no Partytown in sight.
- Create an `index.html` which loads your library, but also sets up Partytown. This file should:
  - Setup the `partytown` configuration
  - Load the `partytown.js` file
  - Mark the library / plugin that you want to test as `text/partytown` instead of `text/javascript`

To get a sense of this, you can take a look at some examples in the `tests/integrations` folder like [Twitter](https://github.com/BuilderIO/partytown/tree/main/tests/integrations/twitter/index.html). Usually, creating a copy of one of these folders and modifying it for a new plugin is the easiest way to get these to setup.

If it works, great! Send us a PR and we'd love to merge it in and highlight it as a working integration on our [Common Services page](https://partytown.qwik.dev/common-services) . If for any reason it does not work, we would love to help you figure out why it might not be working and figure out a way forward.

## Manual Testing

Tests to be manually ran on a browser are located in the `tests` directory. These pages can help to test out DOM apis and individual services.

```
npm run serve
```

http://localhost:4000/tests/

## E2E Testing

E2E tests use [@playwright/test](https://playwright.dev/docs/intro#writing-assertions), which allows us to test on Chromium, Firefox and WebKit browsers. These pages are also tested on every commit within the project's [CI Workflow](https://github.com/BuilderIO/partytown/actions/workflows/ci.yml).

```
npm test
```

[CI Test Results](https://github.com/BuilderIO/partytown/actions/workflows/ci.yml)

## Deployed Tests

The same pages found in `tests` are deployed to:

https://partytown.qwik.dev/


## Contributing a Pull Request (PR)? Please add a changeset


For your convenience, we prepared a video tutorial that covers the process of adding a changeset:

[📽 TUTORIAL: Adding a changeset](https://go.screenpal.com/watch/cZivIcVPJQV)

**1.** Run the following command to create a changeset:

```shell
pnpm change
```

**2.** Choose the packages that should be included in the changeset

**3** Choose the specific type of change

(hit `Enter` if you need to skip to the next option)

- `major` for breaking changes
- `minor` for new features
- `patch` for bug fixes

**4.** Prefix your change title with one of these:

- `FEAT:` or `feat:` for features
- `FIX:` or `fix:` for bug fixes
- `DOCS` or `docs:` for documentation

**5.** Modify the created MD file

After the `change` command runs, a new MD file will be created under the `.changeset` folder.

Please modify this file to include a descriptive message of the changes you made.

You can even add code examples if you need do, to describe a new feature for example. (pun intended 😉)

The prefix and this elaborated description will be used to create the changelog files and release notes, so please give them love. 💗😊

---

#### ❓ "What if my PR is not a significant change?"

If you made small changes like fixing typos, CI config, prettier, etc, you can run `pnpm change add --empty` to generate an empty changeset file to document
your changes.

---

## Publishing

```
npm run release
```
