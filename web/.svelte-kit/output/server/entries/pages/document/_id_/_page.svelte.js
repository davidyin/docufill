import { c as create_ssr_component, s as subscribe, v as validate_component } from "../../../../chunks/ssr.js";
import { p as page } from "../../../../chunks/stores.js";
import "../../../../chunks/clerk.js";
import { e as editableFields } from "../../../../chunks/index2.js";
import { S as Spinner } from "../../../../chunks/Spinner.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  let $$unsubscribe_editableFields;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$unsubscribe_editableFields = subscribe(editableFields, (value) => value);
  $page.params.id;
  $$unsubscribe_page();
  $$unsubscribe_editableFields();
  return `<div class="h-full overflow-y-auto scroll-container"><div class="max-w-3xl mx-auto p-4 lg:p-6">${` <div class="flex flex-col items-center justify-center py-20 gap-4">${validate_component(Spinner, "Spinner").$$render($$result, { size: "lg" }, {}, {})} <span class="text-text-tertiary text-sm" data-svelte-h="svelte-2tydgs">Loading document...</span></div>`}</div></div>`;
});
export {
  Page as default
};
