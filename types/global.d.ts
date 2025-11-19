// Ambient declarations to quiet missing type errors during iterative fixes.
declare module 'web-push'

// Allow imports from UI alias paths used across the repo when types are missing.
declare module '@/components/ui/*' {
  const uiAny: any
  export = uiAny
}

// Loose-typed internal libs that are partially typed in the repo

// Global additions
interface Window {
  workbox?: any
}

export {}
