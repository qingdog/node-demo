import {chat} from '../request/chat.js'
import express from 'express'
const router = express.Router();
router.use((req, res, next) => {
    console.log('时间戳：', Date.now())
    next()
})

router.post('/chat/completions', (req, res) => {
    res.setHeader('Content-type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let rawData = '';

    let content = '';

    // res.write(`data: ${JSON.stringify(resData)}\n\n`);

    // 请求体数据，express解析需要app.use(express.json());
    chat(req.body).then(response => {
        response.data.on('data', (chunk) => {
            // 将字节转换为 UTF-8 字符串
            const decodedChunk = chunk.toString('UTF-8');

            // 将数据写入响应流
            res.write(decodedChunk);

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
        });

        response.data.on('end', () => {
            console.info(content)
            res.end()
        });

    }).catch(error => {
        console.error('错误：', error);
        res.status(500).send('Internal Server Error');
    }).finally(()=>{
    })
});

router.post("/", (req, res) => {
    // 响应格式
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
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });
    let step = 0;
    const time = setInterval(() => {
        if (step <= 18) {
            res.write(`data: ${JSON.stringify(resData)}\n\n`);
        } else if (step === 19) {
            resData.choices[resData.choices.length - 1].delta.content = undefined
            resData.choices[resData.choices.length - 1].finish_reason = 'stop'
            res.write(`data: ${JSON.stringify(resData)}\n\n`);
        } else if (step === 20) {
            res.write(`data: [DONE]\n\n`);
            res.end()
            clearInterval(time)
        }
        step++;
    }, 100);
});

// module.exports = router;
export default router;
