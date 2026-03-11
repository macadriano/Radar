/**
 * Configuración de PM2 para Radar Contractual.
 * Uso en el servidor: pm2 start ecosystem.config.cjs
 * La app escucha en el puerto 3001 (para no chocar con otra app en 3000).
 */
module.exports = {
  name: 'radar',
  script: 'node_modules/next/dist/bin/next',
  args: 'start',
  cwd: __dirname,
  instances: 1,
  autorestart: true,
  watch: false,
  max_memory_restart: '500M',
  env: {
    NODE_ENV: 'production',
    PORT: 3001,
  },
};
