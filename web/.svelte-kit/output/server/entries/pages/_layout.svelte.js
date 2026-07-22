import { c as create_ssr_component, s as subscribe, b as each, d as add_attribute, e as escape, o as onDestroy, v as validate_component } from "../../chunks/ssr.js";
import { p as page } from "../../chunks/stores.js";
import { S as Spinner } from "../../chunks/Spinner.js";
import { a as authReady, i as isSignedIn } from "../../chunks/clerk.js";
const Sidebar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let path;
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let { isDesktop = false } = $$props;
  const navItems = [
    {
      id: "dashboard",
      label: "Documents",
      href: "/",
      icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
    },
    {
      id: "upload",
      label: "Upload",
      href: "/upload",
      icon: "M9 13.5l3-3m0 0l3 3m-3-3v9M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    }
  ];
  function isActive(href) {
    if (href === "/") return path === "/" || path.startsWith("/document/");
    return path.startsWith(href);
  }
  if ($$props.isDesktop === void 0 && $$bindings.isDesktop && isDesktop !== void 0) $$bindings.isDesktop(isDesktop);
  path = $page.url.pathname;
  $$unsubscribe_page();
  return `${isDesktop ? ` <nav class="w-60 h-full bg-bg-elevated/50 border-r border-white/[0.06] flex flex-col"> <div class="p-5 border-b border-white/[0.06]" data-svelte-h="svelte-1bs3s4l"><div class="flex items-center gap-2.5"><div class="w-8 h-8 rounded-lg bg-gradient-to-br from-docufill-orange to-docufill-yellow flex items-center justify-center"><svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div> <div><h1 class="text-base font-display font-bold text-text-primary">DocuFill</h1> <p class="text-[10px] text-text-tertiary">AI Document Extractor</p></div></div></div>  <div class="p-3 flex-1"><div class="space-y-1">${each(navItems, (item) => {
    return `<a${add_attribute("href", item.href, 0)} class="${[
      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors touchable " + escape(isActive(item.href) ? "bg-docufill-orange/10" : "", true) + " " + escape(!isActive(item.href) ? "hover:bg-white/[0.04]" : "", true),
      (isActive(item.href) ? "text-docufill-orange" : "") + " " + (!isActive(item.href) ? "text-text-secondary" : "")
    ].join(" ").trim()}"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round"${add_attribute("d", item.icon, 0)}></path></svg> ${escape(item.label)} </a>`;
  })}</div></div>  <div class="p-4 border-t border-white/[0.06]" data-svelte-h="svelte-1u4l84k"><div class="text-[10px] text-text-tertiary font-mono">v0.1.0 · AI Powered</div></div></nav>` : ` <nav class="tab-bar bg-bg-primary/80 backdrop-blur-2xl border-t border-white/[0.06] flex items-center justify-around px-2 pt-2 z-50">${each(navItems, (item) => {
    return `<a${add_attribute("href", item.href, 0)} class="${[
      "flex flex-col items-center justify-center w-16 h-14 rounded-xl touchable",
      (isActive(item.href) ? "text-text-primary" : "") + " " + (!isActive(item.href) ? "text-text-tertiary" : "")
    ].join(" ").trim()}"><svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round"${add_attribute("d", item.icon, 0)}></path></svg> <span class="text-[10px] mt-0.5 font-medium">${escape(item.label)}</span> ${isActive(item.href) ? `<div class="absolute -bottom-1 w-1 h-1 rounded-full bg-docufill-orange"></div>` : ``} </a>`;
  })}</nav>`}`;
});
function getPageTitle(p) {
  if (p.startsWith("/document/")) return "Document Review";
  if (p === "/upload") return "Upload Document";
  return "DocuFill";
}
const TopBar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let path;
  let title;
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  path = $page.url.pathname;
  title = getPageTitle(path);
  $$unsubscribe_page();
  return ` <div class="h-14 flex items-center justify-between px-4 bg-bg-primary/80 backdrop-blur-2xl border-b border-white/[0.06] safe-top z-50"><div class="flex items-center gap-3" data-svelte-h="svelte-1esurip"><a href="/" class="glass px-2.5 py-1 rounded-full flex items-center gap-1.5 touchable"><div class="w-2 h-2 rounded-full bg-docufill-orange animate-pulse"></div> <span class="text-sm font-display font-bold bg-gradient-to-r from-docufill-orange to-docufill-yellow bg-clip-text text-transparent">DocuFill</span></a></div> <span class="text-base font-display font-semibold">${escape(title)}</span> <div class="w-10">${path !== "/upload" ? `<a href="/upload" class="w-10 h-10 rounded-full bg-gradient-to-br from-docufill-orange to-docufill-yellow flex items-center justify-center touchable shadow-lg shadow-docufill-orange/20" data-svelte-h="svelte-1imvz2j"><svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path></svg></a>` : ``}</div></div>`;
});
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $authReady, $$unsubscribe_authReady;
  let $isSignedIn, $$unsubscribe_isSignedIn;
  $$unsubscribe_authReady = subscribe(authReady, (value) => $authReady = value);
  $$unsubscribe_isSignedIn = subscribe(isSignedIn, (value) => $isSignedIn = value);
  let isDesktop = false;
  onDestroy(() => {
  });
  $$unsubscribe_authReady();
  $$unsubscribe_isSignedIn();
  return `${$$result.head += `<!-- HEAD_svelte-6auexh_START -->${$$result.title = `<title>DocuFill — AI Document Extraction</title>`, ""}<!-- HEAD_svelte-6auexh_END -->`, ""} ${!$authReady ? ` <div class="h-screen w-screen flex flex-col items-center justify-center bg-bg-primary"><div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-docufill-orange to-docufill-yellow flex items-center justify-center mb-5 shadow-lg shadow-docufill-orange/20" data-svelte-h="svelte-kfkad8"><span class="text-2xl">📄</span></div> ${validate_component(Spinner, "Spinner").$$render($$result, { size: "md" }, {}, {})} <span class="text-text-tertiary text-sm mt-4" data-svelte-h="svelte-tbft8b">Loading DocuFill...</span></div>` : `${!$isSignedIn ? ` <div class="h-screen w-screen flex flex-col items-center justify-center bg-bg-primary p-6" data-svelte-h="svelte-k5l9sw"><div class="w-full max-w-sm"> <div class="text-center mb-8"><div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-docufill-orange to-docufill-yellow flex items-center justify-center mb-4 shadow-lg shadow-docufill-orange/20"><span class="text-3xl">📄</span></div> <h1 class="text-2xl font-display font-bold bg-gradient-to-r from-docufill-orange to-docufill-yellow bg-clip-text text-transparent">DocuFill</h1> <p class="text-text-tertiary text-sm mt-2">AI-Powered Document Extraction</p></div>  <a href="/sign-in" class="w-full py-3 px-4 bg-gradient-to-r from-docufill-orange to-docufill-yellow text-black font-semibold rounded-xl touchable shadow-lg shadow-docufill-orange/20 hover:shadow-docufill-orange/30 transition-shadow inline-block text-center">Sign In to Continue</a> <p class="text-text-tertiary text-xs text-center mt-4">Don&#39;t have an account? <a href="/sign-up" class="text-docufill-orange">Sign up</a></p></div></div>` : ` <div class="flex overflow-hidden" style="height: var(--app-height);"> ${``} <div class="flex-1 flex flex-col overflow-hidden"> ${validate_component(TopBar, "TopBar").$$render($$result, {}, {}, {})}  <main class="flex-1 overflow-hidden">${slots.default ? slots.default({}) : ``}</main>  ${`<div class="safe-bottom">${validate_component(Sidebar, "Sidebar").$$render($$result, { isDesktop }, {}, {})}</div>`}</div></div>`}`}`;
});
export {
  Layout as default
};
