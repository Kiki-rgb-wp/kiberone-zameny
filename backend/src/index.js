/**
 * Точка входа API «Замены KIBERone».
 * Запуск: npm run dev или PORT=3000 node src/index.js
 */
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API запущен на порту ${PORT}`);
});
