

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/sign-up/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/5.BEEdbOaX.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/CC71i9g6.js","_app/immutable/chunks/CKdjg3_A.js"];
export const stylesheets = ["_app/immutable/assets/4.DpTW3rfD.css"];
export const fonts = [];
