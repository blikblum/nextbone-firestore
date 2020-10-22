export const isOnline = () => {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine
  }
  return false
}
