import { c as create_ssr_component, d as add_attribute, e as escape, v as validate_component } from "../../chunks/ssr.js";
import "../../chunks/clerk.js";
import "../../chunks/index2.js";
import { S as Spinner } from "../../chunks/Spinner.js";
function getClasses(variant2, padding2, clickable) {
  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6"
  };
  const variants = {
    default: "bg-bg-card border border-white/[0.06] rounded-2xl",
    elevated: "glass",
    interactive: "glass touchable cursor-pointer hover:border-docufill-orange/20"
  };
  return `${variants[variant2]} ${paddings[padding2]}`;
}
const Card = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classes;
  let { variant = "default" } = $$props;
  let { padding = "md" } = $$props;
  let { onClick = void 0 } = $$props;
  if ($$props.variant === void 0 && $$bindings.variant && variant !== void 0) $$bindings.variant(variant);
  if ($$props.padding === void 0 && $$bindings.padding && padding !== void 0) $$bindings.padding(padding);
  if ($$props.onClick === void 0 && $$bindings.onClick && onClick !== void 0) $$bindings.onClick(onClick);
  classes = getClasses(variant, padding);
  return `<div${add_attribute("class", classes, 0)}${add_attribute("role", onClick ? "button" : void 0, 0)}${add_attribute("tabindex", onClick ? 0 : void 0, 0)}>${slots.default ? slots.default({}) : ``}</div>`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let recentDocs = [];
  return `<div class="h-full overflow-y-auto scroll-container"><div class="max-w-4xl mx-auto p-4 lg:p-6"> <div class="mb-8 animate-fade-in" data-svelte-h="svelte-165helt"><div class="glass-strong p-6 lg:p-8 relative overflow-hidden"> <div class="absolute -top-20 -right-20 w-60 h-60 bg-docufill-orange/10 rounded-full blur-3xl"></div> <div class="relative"><h1 class="text-2xl lg:text-3xl font-display font-bold mb-2">Hi there 👋</h1> <p class="text-text-secondary text-sm lg:text-base mb-5 max-w-lg">Upload any document — receipt, invoice, tax slip — and let AI extract the key fields instantly.</p> <div class="flex flex-wrap gap-3"><a href="/upload" class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-docufill-orange to-docufill-yellow text-black font-semibold text-sm rounded-xl touchable shadow-lg shadow-docufill-orange/20"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path></svg>
              Upload Document</a> <a href="/upload" class="inline-flex items-center gap-2 px-5 py-2.5 bg-bg-elevated border border-white/[0.08] text-text-primary font-medium text-sm rounded-xl touchable"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"></path></svg>
              Scan with Camera</a></div></div></div></div>  <div class="mb-6"><div class="flex items-center justify-between mb-4"><h2 class="text-lg font-display font-semibold" data-svelte-h="svelte-39mcd8">Recent Documents</h2> <div class="flex items-center gap-2">${recentDocs.some((d) => d.status === "extracted") ? `<button class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-white/[0.08] text-text-secondary hover:border-docufill-orange/30 hover:text-docufill-orange transition-all touchable" ${""}>${`<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"></path></svg>`} ${escape("Export All")}</button>` : ``} ${recentDocs.length > 0 ? `<span class="text-xs text-text-tertiary">${escape(recentDocs.length)} total</span>` : ``}</div></div> ${`<div class="flex flex-col items-center justify-center py-16 gap-4">${validate_component(Spinner, "Spinner").$$render($$result, { size: "lg" }, {}, {})} <span class="text-text-tertiary text-sm" data-svelte-h="svelte-xz9j0l">Loading documents...</span></div>`}</div>  <div class="mb-8"><h2 class="text-lg font-display font-semibold mb-4" data-svelte-h="svelte-1pldl78">How it works</h2> <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">${validate_component(Card, "Card").$$render($$result, { padding: "lg", variant: "default" }, {}, {
    default: () => {
      return `<div class="text-2xl mb-3" data-svelte-h="svelte-1e1mtkz">📤</div> <h3 class="font-medium text-sm text-text-primary mb-1" data-svelte-h="svelte-8swxj3">1. Upload</h3> <p class="text-xs text-text-tertiary leading-relaxed" data-svelte-h="svelte-1yzufrw">Snap a photo or upload any document — receipt, invoice, tax slip</p>`;
    }
  })} ${validate_component(Card, "Card").$$render($$result, { padding: "lg", variant: "default" }, {}, {
    default: () => {
      return `<div class="text-2xl mb-3" data-svelte-h="svelte-1gl9zx4">🤖</div> <h3 class="font-medium text-sm text-text-primary mb-1" data-svelte-h="svelte-2u3qmh">2. AI Extracts</h3> <p class="text-xs text-text-tertiary leading-relaxed" data-svelte-h="svelte-1i0ybtb">Our AI identifies and extracts all key fields with confidence scores</p>`;
    }
  })} ${validate_component(Card, "Card").$$render($$result, { padding: "lg", variant: "default" }, {}, {
    default: () => {
      return `<div class="text-2xl mb-3" data-svelte-h="svelte-1gt74t1">✅</div> <h3 class="font-medium text-sm text-text-primary mb-1" data-svelte-h="svelte-1ui88my">3. Review &amp; Export</h3> <p class="text-xs text-text-tertiary leading-relaxed" data-svelte-h="svelte-b8vxl1">Edit any field, then export as text or use the data for forms</p>`;
    }
  })}</div></div></div></div>`;
});
export {
  Page as default
};
