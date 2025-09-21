/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./frontend/js/**/*.js",
    "./notes/**/*.md"
  ],
  theme: {
    extend: {
      // 可以在这里添加自定义主题配置
      fontFamily: {
        'mono': ['Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
