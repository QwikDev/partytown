import { component$ } from "@qwik.dev/core";
import { GitHubIcon } from "../Icons/GitHubIcon";

export const Footer = component$(() => {
  return (
    <footer class="flex border-t-[2px] border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-black">
      <div class="grid w-full grid-cols-12">
        <div class="col-span-4" />
        <div class="col-span-4" />
        <div class="col-span-4 flex justify-end">
          <a
            target="_blank"
            href="https://github.com/QwikDev/RoadPlan"
            rel="noopener noreferrer"
            title="QwikDev/RoadPlan"
            aria-label="QwikDev/RoadPlan"
          >
            <GitHubIcon />
          </a>
        </div>
      </div>
    </footer>
  );
});
