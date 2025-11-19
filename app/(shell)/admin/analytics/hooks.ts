// Return small, renderable stubs for the admin analytics pages.
// The original exports returned objects containing functions which caused
// Next.js to attempt to serialize functions during static rendering.
export function useAIInsights() {
	return 'AI insights (stub)'
}

export function useBlockchainVerification() {
	return 'Blockchain verification status (stub)'
}

export function useRPAAutomation() {
	return 'RPA automation status (stub)'
}

export default {}
