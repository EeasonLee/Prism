const path = require('path');
const fs = require('fs');

// 开发环境：仅 jd-frontend-dev，端口 3090
// 优先加载 .env.local（开发环境实际配置），回退到 .env.production
const envFiles = [
  path.join(__dirname, '.env.local'),
  path.join(__dirname, '.env.production'),
];

const envVars = {
  NODE_ENV: 'development',
  PORT: '3090',
  NODE_OPTIONS: '--max-old-space-size=900',
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const envContent = fs.readFileSync(filePath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        envVars[key] = value;
      }
    }
  });
}

envFiles.forEach(loadEnvFile);

module.exports = {
  apps: [
    {
      name: 'jd-frontend-dev',
      cwd: __dirname,

      script: 'pnpm',
      args: 'run dev -- --port=3090 --hostname=0.0.0.0',
      interpreter: 'none',

      env: {
        ...envVars,
        PORT: '3090',
      },

      instances: 1,
      exec_mode: 'fork',

      error_file: '/www/wwwlogs/jd-frontend-dev-error.log',
      out_file: '/www/wwwlogs/jd-frontend-dev-out.log',
      time: true,
      merge_logs: true,

      autorestart: true,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      kill_timeout: 10000,
      listen_timeout: 120000,
      shutdown_with_message: true,
    },
  ],
};
