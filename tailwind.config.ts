import type { Config } from 'tailwindcss';

export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {
            colors: {
                perspective: {
                    default: '#ffffff',
                    digitality: '#00ffff',
                    sustainability: '#4ade80',
                    justice: '#facc15',
                    structure: '#a78bfa'
                }
            },
            backdropBlur: {
                xs: '2px'
            }
        }
    },
    plugins: []
} satisfies Config;
