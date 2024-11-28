// const express = require('express');
// const NewsBot = require('./notifycast+/app');
// const { PORT } = require('./notifycast+/config');

// const app = express();

// app.get('/health', (req, res) => {
//   res.status(200).json({ status: 'ok' });
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
//   NewsBot.launch();
// });
const express = require('express');
const NewsBot = require('./notifycast+/app');
const { PORT } = require('./notifycast+/config');
const axios = require('axios');

const app = express();

// Keep-alive mechanism
const RENDER_URL = process.env.RENDER_URL; // Your Render deployment URL
const pingInterval = 5 * 60 * 1000; // 5 minutes

function keepAlive() {
    setInterval(async () => {
        try {
            await axios.get(`${RENDER_URL}/health`);
            console.log('Keep-alive ping successful');
        } catch (error) {
            console.log('Keep-alive ping failed, but continuing...');
        }
    }, pingInterval);
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    NewsBot.launch();
    
    if (RENDER_URL) {
        keepAlive();
        console.log('Keep-alive mechanism activated');
    }
});
