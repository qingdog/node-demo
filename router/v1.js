const express = require('express');
const router = express.Router();

const {v4: uuidv4} = require('uuid');
const clientId = uuidv4();
const EventSource = require('eventsource');


const {chat} = require('../request/chat.js');
const {fetchEventSource, EventStreamContentType} = require("@microsoft/fetch-event-source");

// middleware that is specific to this router
router.use((req, res, next) => {
    console.log('时间戳：', Date.now())
    next()
})

// 导入 env
const chatApi = process.env.ENV_CHAT_API;
const chatUri = process.env.ENV_CHAT_URI;
const chatApiSecret = process.env.ENV_CHAT_API_SECRET;

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

    const eventSource = new EventSource(url, { headers , body: data});

    eventSource.onopen = (event) => {
        console.log('Connection opened:', event);
    };

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(data); // 在控制台中查看收到的消息

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

    // class RetriableError extends Error { }
    // class FatalError extends Error { }
    //
    // fetchEventSource(url, {
    //     method: 'POST',
    //     headers,
    //     body: JSON.stringify(data),
    //
    //     async onopen(response) {
    //         if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
    //             console.log(true)
    //
    //             return; // everything's good
    //         } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
    //             // client-side errors are usually non-retriable:
    //             throw new FatalError();
    //         } else {
    //             throw new RetriableError();
    //         }
    //     },
    //     onmessage(msg) {
    //         // if the server emits an error message, throw an exception
    //         // so it gets handled by the onerror callback below:
    //         if (msg.event === 'FatalError') {
    //             throw new FatalError(msg.data);
    //         }
    //     },
    //     onclose() {
    //         // if the server closes the connection unexpectedly, retry:
    //         throw new RetriableError();
    //     },
    //     onerror(err) {
    //         if (err instanceof FatalError) {
    //             throw err; // rethrow to stop the operation
    //         } else {
    //             // do nothing to automatically retry. You can also
    //             // return a specific retry interval here.
    //         }
    //     }
    // });

});

const axios = require('../util/myaxios');


router.post('/chat/completions', (req, res) => {
    res.setHeader('Content-type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let rawData = '';

    let content = '';
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


        // const chunks = response.data.split('\n');
        // for (let i = 0; i < chunks.length; i++) {
        //     let chunk = chunks[i];
        //     if (chunks.length -1 !== i) {
        //         chunk += '\n'
        //     }
        //     res.write(chunk);
        // }
        // res.end()
    }).catch(error => {
        console.error('错误：', error);
        res.status(500).send('Internal Server Error');
    });
});

router.get("/", (req, res) => {
    res.send('hello v1!')
});

module.exports = router;