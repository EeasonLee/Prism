const path = require('path');
const fs = require('fs');

// 获取项目根目录
const projectRoot = path.resolve(__dirname, '..');
const deployDir = path.join(projectRoot, 'public_html/frontend/dist');
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
      name: 'joydeem-nextjs',
      cwd: deployDir,

      // 直接运行 next start
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3002',
      interpreter: 'node',

      env: envVars,

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
  ],
};
