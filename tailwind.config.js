/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './_layouts/**/*.html',
    './_includes/**/*.html',
    './_posts/**/*.{md,mdx}',
    './pages/**/*.{md,mdx,html}',
    './*.{html,md,mdx}',
    './assets/js/**/*.js',
    // Include MDX-generated markdown files
    './_mdx-generated/**/*.md'
  ],
  // Prefix Tailwind utilities to avoid conflicts with Bootstrap
  prefix: 'tw-',
  // Disable Tailwind's base styles to preserve Bootstrap
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        // Extend with theme colors from _config.yml
        primary: '#007bff',
        secondary: '#6c757d',
      },
      fontFamily: {
        // Match Bootstrap's default font stack
        sans: [
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [
    // Add useful Tailwind plugins for content
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ].filter(Boolean),
}
