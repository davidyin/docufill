import { d as derived, w as writable } from "./index.js";
const clerkLoaded = writable(false);
const isSignedIn = writable(false);
const authReady = derived(
  [clerkLoaded, isSignedIn],
  ([$loaded, $signedIn]) => {
    return $loaded && $signedIn;
  }
);
export {
  authReady as a,
  isSignedIn as i
};
