import { c as create_ssr_component } from "../../../chunks/ssr.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${$$result.head += `<!-- HEAD_svelte-1e8ihgv_START -->${$$result.title = `<title>Sign Up — DocuFill</title>`, ""}<!-- HEAD_svelte-1e8ihgv_END -->`, ""} <div class="min-h-screen flex items-center justify-center bg-bg-primary p-6"><div class="w-full max-w-md"><div class="text-center mb-8" data-svelte-h="svelte-18km2zh"><div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-docufill-orange to-docufill-yellow flex items-center justify-center mb-4 shadow-lg shadow-docufill-orange/20"><span class="text-3xl">📄</span></div> <h1 class="text-2xl font-display font-bold bg-gradient-to-r from-docufill-orange to-docufill-yellow bg-clip-text text-transparent">DocuFill</h1> <p class="text-text-tertiary text-sm mt-2">Create your account</p></div> ${`<div class="flex flex-col items-center py-8 gap-3" data-svelte-h="svelte-wvbruj"><div class="w-8 h-8 border-2 border-docufill-orange border-t-transparent rounded-full animate-spin"></div> <span class="text-text-tertiary text-sm">Loading…</span></div>`}</div></div>`;
});
export {
  Page as default
};
