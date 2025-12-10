import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const wpUrl = env.VITE_WP_URL || 'http://ci.test';

	return {
		plugins: [sveltekit()],
		server: {
			proxy: {
				// Proxy für WordPress REST API
				'/wp-json': {
					target: wpUrl,
					changeOrigin: true,
					rewrite: (path) => path
				},
				// Proxy für WordPress Uploads (CORS-Umgehung in Entwicklung)
				'/wp-content/uploads': {
					target: wpUrl,
					changeOrigin: true,
					rewrite: (path) => path
				}
			}
		}
	};
});
