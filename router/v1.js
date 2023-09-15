import EventSource from 'eventsource'
import {chat} from '../request/chat.js'
import express from 'express'
const router = express.Router();
router.use((req, res, next) => {
    console.log('时间戳：', Date.now())
    next()
})

const chatApi = process.env.ENV_CHAT_API;
const chatUri = process.env.ENV_CHAT_URI;
const chatApiSecret = process.env.ENV_CHAT_API_SECRET;

// todo 尝试在nodejs环境上使用EventSource发送post请求，接收结果处理
router.post('/chat/completions2', (req, res) => {
    console.log(chatApi + chatUri)
    // const es = new EventSource(chatApi + chatUri, {headers: {'Authorization': chatApiSecret}});
    //
    // es.onmessage = (event) => {
    //     console.error('EventSource failed:', '132');
    //     res.write(`data: ${JSON.stringify(event.data)}\n\n`);
    // };
    //
    // es.onerror = (error) => {
    //     console.error('EventSource failed:', error);
    //     es.close();
    //     res.end();
    // };
    //
    // req.on('close', () => {
    //     es.close();
    // });

    const url = chatApi + chatUri;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + chatApiSecret,
        'Accept': 'text/event-stream'
    };

    const data = {
        "messages": [
            {
                "role": "system",
                "content": "You are ChatGPT, a large language model trained by OpenAI.\nCarefully heed the user's instructions. \nRespond using Markdown."
            },
            {
                "role": "user",
                "content": "你好啊"
            }
        ],
        "model": "gpt-3.5-turbo",
        "max_tokens": null,
        "temperature": 1,
        "presence_penalty": 0,
        "top_p": 1,
        "frequency_penalty": 0,
        "stream": true
    };

    const es = new EventSource(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + chatApiSecret
        }, body: data
    });

    const eventSource = new EventSource(url, {headers, body: data});

    eventSource.onopen = (event) => {
        console.log('Connection opened:', event);
    };

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // console.log(data); // 在控制台中查看收到的消息

        // 处理接收到的消息，可以在这里执行您的逻辑
    };

    eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
    };

    es.onerror = (error) => {
        console.error('错误：', error);
        es.close();
        res.send(error);
    };

});

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