import { component$, useSignal } from "@qwik.dev/core";
import { useContent } from "@qwik.dev/router";

export const Toc = component$(() => {
  const { headings } = useContent();
  const lastScrollIdSig = useSignal("");
  return (
    <div class="fixed flex w-full flex-col px-6 pt-28 text-xl text-black dark:text-white">
      <span class="mb-2 text-lg font-bold uppercase">On this page</span>
      {(headings || []).map(({ text, id }, idx) => (
        <ul
          key={idx}
          class="border-l-[4px] py-1 pl-4 hover:border-blue-700"
          onMouseOver$={() => {
            if (lastScrollIdSig.value !== id) {
              const el = document.querySelector(`#${id}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth" });
                lastScrollIdSig.value = id;
              }
            }
          }}
        >
          <li class="text-base hover:text-blue-500">
            <a href={`#${id}`}>{text}</a>
          </li>
        </ul>
      ))}
    </div>
  );
});
