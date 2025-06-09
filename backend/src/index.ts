import App from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

const app = new App();
app.start(PORT);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});
