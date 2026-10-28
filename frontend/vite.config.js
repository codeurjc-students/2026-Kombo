import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Forwards /api requests to the backend during development
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    // Simulated browser (virtual DOM) for the tests
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    coverage: {
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/setupTests.js', 'src/**/*.test.{js,jsx}'],
      reporter: ['text', 'html', ['lcov', { projectRoot: '..' }]],
    },
    // Two groups of tests, so CI can run them separately:
    // - unit: *.test.jsx, no backend needed
    // - integration: *.integration.test.jsx, needs the backend running
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.{js,jsx}'],
          exclude: ['src/**/*.integration.test.{js,jsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['src/**/*.integration.test.{js,jsx}'],
        },
      },
    ],
  },
});