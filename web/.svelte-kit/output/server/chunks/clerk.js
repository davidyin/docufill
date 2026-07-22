import { d as derived, w as writable } from "./index.js";
const clerkLoaded = writable(false);
const isSignedIn = writable(false);
const authReady = derived(
  clerkLoaded,
  ($loaded) => {
    return $loaded;
  }
);
export {
  authReady as a,
  isSignedIn as i
};
