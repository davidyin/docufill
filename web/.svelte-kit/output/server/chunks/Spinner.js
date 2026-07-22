import { c as create_ssr_component, e as escape } from "./ssr.js";
function getSize(size2) {
  const sizes2 = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-10 h-10 border-4"
  };
  return sizes2[size2];
}
const Spinner = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let sizes;
  let colors;
  let { size = "md" } = $$props;
  let { color = "orange" } = $$props;
  if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
  if ($$props.color === void 0 && $$bindings.color && color !== void 0) $$bindings.color(color);
  sizes = getSize(size);
  colors = color === "orange" ? "border-docufill-orange border-t-transparent" : "border-white border-t-transparent";
  return `<div class="${escape(sizes, true) + " " + escape(colors, true) + " rounded-full animate-spin"}" role="status" aria-label="Loading"></div>`;
});
export {
  Spinner as S
};
