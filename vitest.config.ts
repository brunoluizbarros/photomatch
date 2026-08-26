import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    // Alguns módulos importam src/config/env.ts no top-level; valores dummy
    // bastam para passar a validação zod em testes que não tocam AWS/S3 de verdade.
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test',
      BETTER_AUTH_SECRET: 'test-secret',
      STORAGE_ENDPOINT: 'http://localhost:9000',
      STORAGE_BUCKET: 'test-bucket',
      STORAGE_ACCESS_KEY_ID: 'test',
      STORAGE_SECRET_ACCESS_KEY: 'test',
    },
  },
});
