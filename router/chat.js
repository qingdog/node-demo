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

    let rawData = '';

    let content = '';
    // 请求体数据，express解析需要app.use(express.json());
    chat(req.body).then(response => {
        response.data.on('data', (chunk) => {
            // 将字节转换为 UTF-8 字符串
            const decodedChunk = chunk.toString('UTF-8');

            rawData += decodedChunk; // 将chunk转换成字符串拼接到rawData中
            const chunks = rawData.split('\n\n'); // 根据SSE的规范，每个消息以两个换行符分隔
            rawData = chunks.pop(); // 将最后一个不完整的消息保存在rawData中

            for (const chunk of chunks) {
                chunk.trim();
                const checkChunk = chunk.substring(6);// 去除 "data: " 前缀
                if (checkChunk) {
                    try {
                        if ('[DONE]' === checkChunk)
                            break;
                        const jsonData = JSON.parse(checkChunk);
                        content += jsonData.choices?.[0]?.delta?.content || '';
                    } catch (error) {
                        console.error('解析JSON失败：', error);
                    }
                }
            }

            // 将数据写入响应流
            res.write(decodedChunk);
        });

        response.data.on('end', () => {
            console.info(content)
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