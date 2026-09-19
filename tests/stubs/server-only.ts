// Test stub for the `server-only` package.
//
// The real module throws unless the bundler resolves it under the
// "react-server" condition, which Next.js sets for server code and
// deliberately does NOT set for the client bundle — that is what makes
// `import 'server-only'` a build-time guard.
//
// Vitest runs plain Node and sets no such condition, so the real module
// would throw for every server module under test. Stubbing it here is safe:
// the guard exists to keep DB code out of the *client bundle*, and a Node
// test run has no client bundle to protect. The production build still
// resolves the real package, so the guarantee is unchanged where it counts.
export {};
