

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/sign-up/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/5.D-M8vj_k.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/C94cdf1Y.js","_app/immutable/chunks/DdMcJQaw.js"];
export const stylesheets = [];
export const fonts = [];
