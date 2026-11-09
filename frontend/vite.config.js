import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Forwards /api requests to the backend during development. The backend only listens on HTTPS
    // with a self-signed certificate, so the proxy must not validate it (secure: false).
    // KOMBO_BACKEND_URL changes the address, for example https://localhost:8443.
    proxy: {
      '/api': {
        target: process.env.KOMBO_BACKEND_URL ?? 'https://localhost',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    // Simulated browser (virtual DOM) for the tests
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    coverage: {
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/setupTests.js', 'src/test-utils.jsx', 'src/**/*.test.{js,jsx}'],
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
          // The tests call the backend directly over HTTPS; its certificate is self-signed,
          // so Node.js is told not to validate it (only in these tests)
          env: { NODE_TLS_REJECT_UNAUTHORIZED: '0' },
        },
      },
    ],
  },
});