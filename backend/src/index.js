const app = require('./app');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_jwt_secret_key_here_change_in_production') {
  console.error('FATAL: JWT_SECRET is missing or matches the default placeholder value. Server cannot start.');
  process.exit(1);
}

const DEFAULT_PORT = process.env.PORT || 5000;

function startServer(port) {
  app.listen(port, () => {
    console.log(`Server running in development mode on port ${port}`);
    console.log(`API health endpoint: http://localhost:${port}/health`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} in use, trying next port...`);
      startServer(Number(port) + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(DEFAULT_PORT);
