const express = require('express');
const router = express.Router();



const {chat} = require('../request/chat.js');

// middleware that is specific to this router
router.use((req, res, next) => {
    console.log('时间戳：', Date.now())
    next()
})

router.post('/chat/completions', (req, res) => {
    res.setHeader('Content-type', 'Content-type: application/octet-stream');

    // 请求体数据，express解析需要app.use(express.json());
    chat(req.body).then(response => {
        response.data.on('data', (chunk) => {
            // 将字节转换为 UTF-8 字符串
            const decodedChunk = chunk.toString('UTF-8');
            console.info(decodedChunk)
            // 将数据写入响应流
            res.write(decodedChunk);
        });

        response.data.on('end', () => {
            res.end()
        });
    }).catch(error => {
        console.error('错误：', error);
        res.status(500).send('Internal Server Error');
    });
});

router.get("/hello", (req, res) => {
    // res.end("hello chat!");
    res.send('hello!')
});


module.exports = router;