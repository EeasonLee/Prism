const path = require('path');
const fs = require('fs');

// 获取当前配置文件所在目录
const projectRoot = __dirname;

// 读取 .env.production.local 文件
const envFile = path.join(projectRoot, '.env.production.local');
const envVars = {
  NODE_ENV: 'production',
  PORT: 3001,
  NODE_OPTIONS: '--max-old-space-size=512',
};

// 如果 .env.production.local 存在，读取并解析
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  envContent.split('\n').forEach(line => {
    // 跳过注释和空行
    if (line.trim() && !line.trim().startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

module.exports = {
  apps: [
    {
      name: 'joydeem-nextjs',
      script: 'node_modules/.bin/nx',
      args: 'start prism',
      interpreter: 'bash',
      cwd: projectRoot,
      instances: 1,
      exec_mode: 'fork',
      env: envVars,
      // 日志配置
      error_file: '/www/wwwlogs/joydeem-nextjs-error.log',
      out_file: '/www/wwwlogs/joydeem-nextjs-out.log',
      log_file: '/www/wwwlogs/joydeem-nextjs.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // 自动重启配置
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',

      // 重启策略
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
