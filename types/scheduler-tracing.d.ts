declare module 'scheduler/tracing' {
  // Minimal ambient declarations to satisfy @types/react imports in this workspace.
  // Keep these broad — React's types only need these names for compatibility.
  export type Interaction = unknown;

  export function unstable_trace<T>(
    name: string,
    timestamp: number | null,
    callback: () => T
  ): T;

  export function unstable_wrap<T extends (...args: any[]) => any>(fn: T): T;

  export function unstable_getCurrentTime(): number;

  export function unstable_subscribe(...args: any[]): any;
  export function unstable_unsubscribe(...args: any[]): any;
}
