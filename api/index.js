const express = require('express');
const app = express()
module.exports = app;

// 开发环境
const {createProxyMiddleware} = require('http-proxy-middleware');
app.use('/proxy', createProxyMiddleware({target: 'http://localhost:8080', changeOrigin: true}));
app.use(express.static('./'))

const port = process.env.ENV_PORT || 7070;
app.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});


// 导入 env
require('dotenv').config();
const baseApi = process.env.ENV_BASE_API;

app.get('/api', (req, res) => {
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.json({'secret': baseApi});
});

// 配置vercel重写以下api请求。"rewrites": [{ "source": "/api/(.*)", "destination": "/api" }]
app.get("/api/item/:slug", (req, res) => {
    const {slug} = req.params;
    res.end(`Item: ${slug}`);
});

const path = require('path');
app.get('/favicon.ico', (req, res) => {
    const imagePath = path.join(__dirname, 'favicon.ico');

    res.sendFile(imagePath, (err) => {
        if (err) {
            console.error(`Error sending file: ${err}`);
            res.status(404).send('Image not found');
        }
    });
});

const chat = require('../router/chat.js')
app.use('/api/chat', chat);