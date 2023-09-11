const express = require('express');
const app = express()
module.exports = app;

// 开发环境
const {createProxyMiddleware} = require('http-proxy-middleware');
app.use('/proxy', createProxyMiddleware({target: 'http://localhost:8080', changeOrigin: true}));
app.use(express.static('./'))

// 导入 env
const dotenv = require('dotenv');
const envFiles = [
    '.env.development', // 优先生效开发环境配置
    '.env'              // 默认配置
];
for (const envFile of envFiles) {
    dotenv.config({ path: envFile });
}

let port = process.env.ENV_DEV_PORT || 7070;
app.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});

// 使用 express.json() 中间件来解析 JSON 请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/api', (req, res) => {
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    const chatApi = process.env.ENV_CHAT_API;
    res.json({'secret': chatApi});
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
app.use('/api/v1', chat);