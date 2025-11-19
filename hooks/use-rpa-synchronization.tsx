export function useRPASynchronization() {
  function synchronizeData() {
    if (typeof window !== "undefined") console.log("synchronizeData: stub called")
  }

  return { synchronizeData }
}
