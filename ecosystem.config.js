const path = require('path');

// 获取当前配置文件所在目录
const projectRoot = __dirname;

module.exports = {
  apps: [
    {
      name: 'joydeem-nextjs',
      script: path.join(projectRoot, 'start.sh'),
      interpreter: 'bash',
      cwd: projectRoot,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        NODE_OPTIONS: '--max-old-space-size=512',
      },
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
