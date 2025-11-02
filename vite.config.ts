import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		proxy: {
			// Proxy API requests to the backend to avoid CORS during development
			'/auth': {
				target: 'http://localhost:8080',
				changeOrigin: true,
				secure: false
			},
			'/cigarettes': {
				target: 'http://localhost:8080',
				changeOrigin: true,
				secure: false
			},
			'/analytics': {
				target: 'http://localhost:8080',
				changeOrigin: true,
				secure: false
			},
			'/me': {
				target: 'http://localhost:8080',
				changeOrigin: true,
				secure: false
			}
		}
	}
});
