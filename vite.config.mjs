import {defineConfig} from 'vite';
import laravel, {refreshPaths} from 'laravel-vite-plugin';

export default defineConfig({
    server: {
        host: 'localhost',
    },
    plugins: [
        laravel({
            publicDirectory: 'exitkiosk',
            input: [
                'resources/js/background.js',
                'resources/js/config.js',
                'resources/css/app.css',
            ],
            refresh: [
                ...refreshPaths,
            ],
        }),
    ],
    build: {
        rollupOptions: {
            output: {
                entryFileNames: `assets/[name].js`,
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`
            }
        }
    },
});