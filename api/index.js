import express from 'express'
import {createProxyMiddleware} from 'http-proxy-middleware'
import v1 from '../router/v1.js'

// 环境变量放 myaxios 中
// import dotenv from 'dotenv';
// dotenv.config();

const app = express()

import cors from 'cors'
const corsOptions = {
    // origin: /github\.io$|vercel\.com/, // 这里vercel分别部署前后端子域名不同无需配置跨域
    origin: /github\.io$|vercel\.app$|localhost:\d{0,5}$/, // 允许的源使用双斜杠正则匹配
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // 允许的方法
    credentials: true, // 是否允许发送凭证（如cookies）
    optionsSuccessStatus: 204 // 对于预检请求，设置为204表示成功
};
app.use(cors(corsOptions));

// 使用 CORS 中间件，不限制任何源进行跨域请求
// app.use(cors());

// app.all('*', (req, res, next) => {
//     const origin = req.headers.origin;
//     if (origin.endsWith('github.io') || origin.endsWith('vercel.com')) {
//         res.header('Access-Control-Allow-Origin', origin);
//     }
//     // 跨域需要请求头包含Content-Type
//     res.header('Access-Control-Allow-Headers', 'Content-Type');
//     res.header('Access-Control-Allow-Methods', '*');
//     next();
// });


// 开发环境
app.use('/proxy', createProxyMiddleware({target: 'https://localhost:8080', changeOrigin: true}));
app.use(express.static('./'))


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
    res.json({'secret-edge': chatApi});
});

// 配置vercel重写以下api请求。"rewrites": [{ "source": "/v1(.*)", "destination": "/api/index.js" }]
app.use('/v1', v1);

// fix.https://github.com/vercel/ai/issues/239
// ref.https://github.com/vercel/vercel/blob/main/packages/node/src/index.ts#L495-L511
export const config = {
    // supportsResponseStreaming只能使用export语法
    supportsResponseStreaming: true,
}

// export default app;