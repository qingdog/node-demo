const express = require('express');
const app = express()

const {createProxyMiddleware} = require('http-proxy-middleware');
app.use('/proxy', createProxyMiddleware({target: 'http://localhost:8080', changeOrigin: true}));
app.use(express.static('./'))

const port = process.env.ENV_PORT || 7070;
app.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
// module.exports = app;

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

const chat = require('./api-chat.js')
app.use('/api/api-chat', chat);