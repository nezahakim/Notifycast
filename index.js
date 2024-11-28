const express = require('express');
const NewsBot = require('./notifycast+/app');
const { PORT } = require('./notifycast+/config');

const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  NewsBot.launch();
});
