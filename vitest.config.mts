import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // `server-only` guards lib/data and lib/db against being pulled into
      // the client bundle. It works by throwing unless the bundler resolves
      // it under the "react-server" condition — which Next sets for server
      // code and withholds from the client bundle. Vitest runs plain Node
      // and sets no condition, so without this alias every server module
      // under test would throw on import. See tests/stubs/server-only.ts.
      'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['./tests/setup-env.ts'],
  },
});
