// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
        },
        outDir: 'dist',
        assetsDir: 'assets',
    },
    optimizeDeps: {
        include: ['pdfjs-dist']
    },
    server: {
        fs: {
            allow: ['..']
        }
    },
    base: './'
});
