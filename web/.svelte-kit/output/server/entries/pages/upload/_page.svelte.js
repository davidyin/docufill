import { c as create_ssr_component, d as add_attribute, e as escape, f as createEventDispatcher, o as onDestroy, s as subscribe, v as validate_component } from "../../../chunks/ssr.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils2.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/state.svelte.js";
import "../../../chunks/clerk.js";
import { u as upload } from "../../../chunks/index2.js";
function getClasses(variant2, size2, disabled2, loading2, fullWidth2) {
  const base = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 touchable relative overflow-hidden";
  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5"
  };
  const variants = {
    primary: "bg-gradient-to-r from-docufill-orange to-docufill-yellow text-black font-semibold shadow-lg shadow-docufill-orange/20",
    secondary: "bg-bg-card border border-white/[0.08] text-text-primary hover:bg-bg-elevated",
    ghost: "text-text-secondary hover:text-text-primary hover:bg-white/[0.06]",
    danger: "bg-docufill-red/15 text-docufill-red border border-docufill-red/30 hover:bg-docufill-red/25"
  };
  const extras = [
    disabled2 || loading2 ? "opacity-50 pointer-events-none" : "",
    fullWidth2 ? "w-full" : ""
  ];
  return `${base} ${sizes[size2]} ${variants[variant2]} ${extras.join(" ")}`;
}
const Button = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classes;
  let { variant = "primary" } = $$props;
  let { size = "md" } = $$props;
  let { disabled = false } = $$props;
  let { loading = false } = $$props;
  let { fullWidth = false } = $$props;
  let { href = void 0 } = $$props;
  let { type = "button" } = $$props;
  if ($$props.variant === void 0 && $$bindings.variant && variant !== void 0) $$bindings.variant(variant);
  if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
  if ($$props.loading === void 0 && $$bindings.loading && loading !== void 0) $$bindings.loading(loading);
  if ($$props.fullWidth === void 0 && $$bindings.fullWidth && fullWidth !== void 0) $$bindings.fullWidth(fullWidth);
  if ($$props.href === void 0 && $$bindings.href && href !== void 0) $$bindings.href(href);
  if ($$props.type === void 0 && $$bindings.type && type !== void 0) $$bindings.type(type);
  classes = getClasses(variant, size, disabled, loading, fullWidth);
  return `${href ? `<a${add_attribute("href", href, 0)} class="${[escape(classes, true), disabled ? "pointer-events-none" : ""].join(" ").trim()}">${loading ? `<span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>` : ``} ${slots.default ? slots.default({}) : ``}</a>` : `<button${add_attribute("type", type, 0)}${add_attribute("class", classes, 0)} ${disabled ? "disabled" : ""}>${loading ? `<span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>` : ``} ${slots.default ? slots.default({}) : ``}</button>`}`;
});
const Dropzone = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { accept = "image/jpeg,image/png,image/webp,application/pdf" } = $$props;
  let { disabled = false } = $$props;
  createEventDispatcher();
  const prevent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  onDestroy(() => {
    document.removeEventListener("dragenter", prevent);
    document.removeEventListener("dragover", prevent);
    document.removeEventListener("dragleave", prevent);
    document.removeEventListener("drop", prevent);
  });
  if ($$props.accept === void 0 && $$bindings.accept && accept !== void 0) $$bindings.accept(accept);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
  return `<div class="${["relative w-full", disabled ? "opacity-50" : ""].join(" ").trim()}"> <button type="button" class="${[
    "w-full min-h-[200px] rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-4 p-8 touchable " + escape("", true),
    " border-border-default bg-bg-card " + (!disabled ? "hover:border-border-active" : "")
  ].join(" ").trim()}" ${disabled ? "disabled" : ""}>${`<div class="flex flex-col items-center gap-3" data-svelte-h="svelte-gpk37w"><div class="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center"><svg class="w-7 h-7 text-text-secondary" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 13.5l3-3m0 0l3 3m-3-3v9M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div> <div class="text-center"><p class="text-text-primary font-medium mb-1">Drag &amp; drop your document</p> <p class="text-text-tertiary text-sm">or click to browse files</p></div> <div class="flex flex-wrap gap-1.5 mt-1"><span class="px-2 py-0.5 bg-bg-elevated rounded text-[10px] text-text-tertiary font-mono">JPG</span> <span class="px-2 py-0.5 bg-bg-elevated rounded text-[10px] text-text-tertiary font-mono">PNG</span> <span class="px-2 py-0.5 bg-bg-elevated rounded text-[10px] text-text-tertiary font-mono">WEBP</span> <span class="px-2 py-0.5 bg-bg-elevated rounded text-[10px] text-text-tertiary font-mono">PDF</span></div></div>`}</button>  <input type="file"${add_attribute("accept", accept, 0)} class="hidden"></div>`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_upload;
  $$unsubscribe_upload = subscribe(upload, (value) => value);
  onDestroy(() => {
  });
  $$unsubscribe_upload();
  return `<div class="h-full overflow-y-auto scroll-container"><div class="max-w-2xl mx-auto p-4 lg:p-6">${`${` <div class="space-y-6"> ${`<div class="space-y-4"> ${validate_component(Dropzone, "Dropzone").$$render($$result, {}, {}, {})}  <div class="flex items-center gap-4" data-svelte-h="svelte-y870t9"><div class="flex-1 h-px bg-white/[0.06]"></div> <span class="text-xs text-text-tertiary">or</span> <div class="flex-1 h-px bg-white/[0.06]"></div></div>  ${validate_component(Button, "Button").$$render($$result, { variant: "secondary", fullWidth: true }, {}, {
    default: () => {
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"></path></svg>
              Scan with Camera`;
    }
  })}</div>`}  ${``}</div>`}`}</div></div>`;
});
export {
  Page as default
};
