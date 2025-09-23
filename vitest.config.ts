/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['node_modules', 'dist', 'build', '.expo'],
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000',
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'src/components/',
        'src/screens/',
        'src/navigation/',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
});
