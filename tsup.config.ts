import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts'],
  target: 'esnext',
  sourcemap: true,
  clean: true,
});
