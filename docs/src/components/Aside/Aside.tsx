import { component$ } from "@qwik.dev/core";
import { Link, useContent } from "@qwik.dev/router";

export const Aside = component$(() => {
  const { menu } = useContent();

  return (
    <div
      class={`fixed top-20 mt-8 flex h-[calc(100%-12rem)] flex-col overflow-hidden overflow-y-auto px-6 text-xl text-black dark:text-white`}
    >
      {(menu?.items || []).map(({ text, items }, idx) => {
        const [title, href] = text.split("|");
        return (
          <ul key={idx} class="mb-6">
            <li>
              <Link
                class="mb-2 block rounded bg-blue-700 px-4 py-1 text-base font-bold uppercase text-white no-underline"
                href={href}
              >
                {title}
              </Link>
              {(items || []).map(({ text, href }, idx) => (
                <ul key={idx}>
                  <li class="py-1 text-black dark:text-white">
                    <Link href={href}>
                      <span class="text-md pl-2">
                        <span>{text}</span>
                      </span>
                    </Link>
                  </li>
                </ul>
              ))}
            </li>
          </ul>
        );
      })}
    </div>
  );
});
