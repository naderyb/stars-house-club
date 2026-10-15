/** Triggers a haptic feedback vibration. */
export function buzz(ms = 8) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(ms);
  }
}
