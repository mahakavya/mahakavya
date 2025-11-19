// Ambient shim module to satisfy TS "Cannot find type definition file for 'shims'" when
// tsconfig or tooling references an implicit 'shims' lib. This file is intentionally
// minimal and should be expanded with real shims if needed.
declare module 'shims' {}

export {}
