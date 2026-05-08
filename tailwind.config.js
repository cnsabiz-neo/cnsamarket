/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#E87823',
        'primary-dark': '#C4641A',
        'primary-light': '#FEF3E9',
        ink: '#333333'
      },
      borderRadius: {
        card: '12px'
      }
    }
  },
  plugins: []
};
