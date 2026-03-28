module.exports = {
  apps: [
    {
      name: "api-monitor",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/root/apps/api-monitor",
      env: {
        NODE_ENV: "production",
        PORT: 3004,
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
