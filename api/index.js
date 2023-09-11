const express = require('express');
const app = express()
module.exports = app;

const cors = require('cors');
// const corsOptions = {
//     origin: 'http://example.com', // 允许的源
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // 允许的方法
//     credentials: true, // 是否允许发送凭证（如cookies）
//     optionsSuccessStatus: 204 // 对于预检请求，设置为204表示成功
// };
// app.use(cors(corsOptions));

// 使用 CORS 中间件，不限制任何源进行跨域请求
app.use(cors());

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

let port = process.env.ENV_DEV_PORT || 3000;
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

app.get("/api/:slug", (req, res) => {
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

// 配置vercel重写以下api请求。"rewrites": [{ "source": "/v1(.*)", "destination": "/api/index.js" }]
const v1 = require('../router/v1.js')
app.use('/v1', v1);