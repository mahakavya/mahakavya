export function usePredictiveCaching() {
  function cacheContent() {
    if (typeof window !== "undefined") console.log("cacheContent: stub called")
  }

  return { cacheContent }
}
