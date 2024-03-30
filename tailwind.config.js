import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import aspect_ratio from '@tailwindcss/aspect-ratio';

module.exports = {
    content: [
        './exitkiosk/*.html',
        './resources/**/*.js',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Nunito', ...defaultTheme.fontFamily.sans],
            }
        }
    },

    variants: {
        extend: {
            opacity: ['disabled'],
        },
    },

    plugins: [
        forms, typography, aspect_ratio,
    ],
};
