

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/sign-up/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/5.BkTYG9OK.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/CpKzatpw.js","_app/immutable/chunks/B3nJjiGy.js"];
export const stylesheets = [];
export const fonts = [];
