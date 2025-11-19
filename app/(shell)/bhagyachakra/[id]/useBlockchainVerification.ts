export function useBlockchainVerification(id: string) {
  return {
    isVerified: true,
    verifyDraw: () => {
      console.log("Verifying draw:", id)
    },
  }
}
