const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 4200;

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on http://localhost:${PORT}`);
});
