// AndiHub fork shim (new file — no upstream conflict surface unless upstream
// adds their own secrets.js one day).
// backend imports './secrets.js' but upstream ships only secrets.ts, which is
// plain erasable JS, so Node 22.6+ executes it directly via this re-export.
export * from "./secrets.ts";
