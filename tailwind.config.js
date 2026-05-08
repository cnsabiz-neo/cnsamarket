/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#007AFF',
        'primary-dark': '#0056b3',
        'primary-light': '#E8F2FF',
        ink: '#333333'
      },
      borderRadius: {
        card: '12px'
      }
    }
  },
  plugins: []
};
