// Raise view[index] to `value` if `value` is bigger. Many threads call this
// at the same time on the same shared Int32Array.
export function atomicMax(view, index, value) {
  if (value > view[index]) {
    view[index] = value;   // another thread may have stored something bigger since we looked
  }
}
