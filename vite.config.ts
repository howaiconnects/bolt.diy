import { cloudflareDevProxyVitePlugin as remixCloudflareDevProxy, vitePlugin as remixVitePlugin } from '@remix-run/dev';
import UnoCSS from 'unocss/vite';
import { defineConfig, type ViteDevServer } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { optimizeCssModules } from 'vite-plugin-optimize-css-modules';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

// Improved git info function with better error handling
const getGitInfo = () => {
  try {
    // Check if git is initialized first
    execSync('git rev-parse --is-inside-work-tree 2>/dev/null');
    
    return {
      commitHash: execSync('git rev-parse --short HEAD 2>/dev/null').toString().trim() || 'no-git-info',
      branch: execSync('git rev-parse --abbrev-ref HEAD 2>/dev/null').toString().trim() || 'main',
      commitTime: execSync('git log -1 --format=%cd 2>/dev/null').toString().trim() || new Date().toISOString(),
      author: execSync('git log -1 --format=%an 2>/dev/null').toString().trim() || 'unknown',
      email: execSync('git log -1 --format=%ae 2>/dev/null').toString().trim() || 'unknown',
      remoteUrl: execSync('git config --get remote.origin.url 2>/dev/null').toString().trim() || 'unknown',
      repoName: (execSync('git config --get remote.origin.url 2>/dev/null').toString().trim() || '')
        .replace(/^.*github.com[:/]/, '')
        .replace(/\.git$/, '') || 'bolt.diy',
    };
  } catch {
    // Silent fallback for non-git environments
    return {
      commitHash: 'no-git-info',
      branch: 'main',
      commitTime: new Date().toISOString(),
      author: 'unknown',
      email: 'unknown',
      remoteUrl: 'unknown',
      repoName: 'bolt.diy',
    };
  }
};

// Rest of your existing code remains the same until the defineConfig...

export default defineConfig((config) => {
  const isDev = config.mode === 'development';
  
  return {
    define: {
      // Your existing define configuration remains the same
    },
    server: {
      port: process.env.PORT || 3000,
      strictPort: true, // Fail if port is already in use
      allowedHosts: [
        'boltdiy-production-6f13.up.railway.app',
        '*.railway.app',
        'localhost',
        '*.localhost',
        // Add any additional domains you need
      ],
      host: true,
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        }
      },
      watch: {
        usePolling: true, // Better handling for some environments
      }
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      sourcemap: isDev,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            // Add other chunk configurations as needed
          }
        }
      },
      // Add better error handling
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000,
    },
    plugins: [
      nodePolyfills({
        include: ['path', 'buffer', 'process'],
      }),
      config.mode !== 'test' && remixCloudflareDevProxy(),
      remixVitePlugin({
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
          v3_lazyRouteDiscovery: true,
          v3_singleFetch: true, // Added as recommended
        },
      }),
      UnoCSS(),
      tsconfigPaths(),
      chrome129IssuePlugin(),
      config.mode === 'production' && optimizeCssModules({ apply: 'build' }),
    ].filter(Boolean), // Filter out false values from plugins array
    envPrefix: [
      'VITE_',
      'OPENAI_LIKE_API_BASE_URL',
      'OLLAMA_API_BASE_URL',
      'LMSTUDIO_API_BASE_URL',
      'TOGETHER_API_BASE_URL',
    ],
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: isDev
          ? '[name]__[local]__[hash:base64:5]'
          : '[hash:base64:5]',
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: [], // Add any dependencies to exclude from optimization
    },
    // Add better error handling
    clearScreen: false,
    logLevel: 'info',
  };
});

// Your chrome129IssuePlugin remains the same
