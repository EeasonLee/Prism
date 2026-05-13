const path = require('path');
const fs = require('fs');

const envFile = path.join(__dirname, '.env.production');

// 读取环境变量文件
const envVars = {
  NODE_ENV: 'production',
  PORT: '3002',
  NODE_OPTIONS: '--max-old-space-size=900',
};

// 如果 .env.production 存在，读取并合并
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  envContent.split('\n').forEach(line => {
    // 跳过注释和空行
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

module.exports = {
  apps: [
    {
      // 生产：Nx next start（需先在本目录 pnpm run build）
      name: 'jd-frontend',
      cwd: __dirname,

      script: 'pnpm',
      args: 'run start -- --port=3090 --hostname=0.0.0.0',
      interpreter: 'none',

      env: {
        ...envVars,
        PORT: '3090',
      },

      instances: 1,
      exec_mode: 'fork',

      // 日志配置
      error_file: '/www/wwwlogs/joydeem-nextjs-error.log',
      out_file: '/www/wwwlogs/joydeem-nextjs-out.log',
      time: true,
      merge_logs: true,

      // 重启策略
      autorestart: true,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // 其他配置
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
    },
    {
      // 仓库根目录 Nx dev（热更新）
      name: 'jd-frontend-dev',
      cwd: __dirname,

      script: 'pnpm',
      args: 'run dev -- --port=3091 --hostname=0.0.0.0',
      interpreter: 'none',

      env: {
        NODE_ENV: 'development',
        PORT: '3091',
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
