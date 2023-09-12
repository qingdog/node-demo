const express = require('express');
const app = express()
module.exports = app;

// const cors = require('cors');
// const corsOptions = {
//     origin: 'http://example.com', // 允许的源
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // 允许的方法
//     credentials: true, // 是否允许发送凭证（如cookies）
//     optionsSuccessStatus: 204 // 对于预检请求，设置为204表示成功
// };
// app.use(cors(corsOptions));
// 使用 CORS 中间件，不限制任何源进行跨域请求
// app.use(cors());
app.all('*', (_, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    res.header('Access-Control-Allow-Methods', '*')
    next()
})

// 开发环境
const {createProxyMiddleware} = require('http-proxy-middleware');
app.use('/proxy', createProxyMiddleware({target: 'https://localhost:8080', changeOrigin: true}));
app.use(express.static('./'))

// 导入 env
const dotenv = require('dotenv');
const envFiles = [
    '.env.development', // 优先生效开发环境配置
    '.env'              // 默认配置
];
for (const envFile of envFiles) {
    dotenv.config({path: envFile});
}

let port = process.env.ENV_DEV_PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});

// 使用 express.json() 中间件来解析 JSON 请求体
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// 这里的/api路径可作为/api/index 即当前目录api下的文件index.js 服务器less函数重写的访问路径
app.get('/api', (req, res) => {
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    const chatApi = process.env.ENV_CHAT_API;
    res.json({'secret': chatApi});
});

// 配置vercel重写以下api请求。"rewrites": [{ "source": "/v1(.*)", "destination": "/api/index.js" }]
const v1 = require('../router/v1.js')
app.use('/v11', v1);

let resData = {
    "id": "chatcmpl-7xx584ZRr5PxiHRVZKlqYx7vKuRsM",
    "object": "chat.completion.chunk",
    "created": 1694522818,
    "model": "gpt-3.5-turbo-0301",
    "choices": [
        {
            "index": 0,
            "delta": {
                "role": "assistant",
                "content": "嘿"
            },
            "finish_reason": null
        }
    ]
}

export const config = {
    supportsResponseStreaming: true,
}

app.post('/v1/chat/completions', (req, res) => {
    const message = "123456789"
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });
    let step = 0;
    const time = setInterval(() => {
        res.write(`data: ${JSON.stringify(resData)}\n\n`);
        if (step === 10) {

            res.write(`data: ${JSON.stringify(data2)}\n\n`);
            res.write(`data: ${JSON.stringify(data3)}\n\n`);

            res.end()
            clearInterval(time)
        }
        step++;
    }, 50);
});

let data2 = {"id":"chatcmpl-7xxHoj8mAdfvCZISNtptJxwExaYYW","object":"chat.completion.chunk","created":1694523604,"model":"gpt-3.5-turbo-0301","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}
let data3 = '[DONE]'