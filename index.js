const express = require('express');
const app = express()

const {createProxyMiddleware} = require('http-proxy-middleware');
app.use('/proxy', createProxyMiddleware({target: 'http://localhost:8080', changeOrigin: true}));
app.use(express.static('./'))

// 导入 env
require('dotenv').config();
const baseApi = process.env.ENV_BASE_API;

app.get('/api', (req, res) => {
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.json({'secret': baseApi});
});


const port = process.env.ENV_PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});