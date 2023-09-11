const axios = require('../util/myaxios');

// 导入 env
require('dotenv').config();
const chatUri = process.env.ENV_CHAT_URI;

let requestBodyData = {
    messages: [
        {
            role: "system",
            content:
                "You are ChatGPT, a large language model trained by OpenAI.\nCarefully heed the user's instructions. \nRespond using Markdown.",
        },
        {
            role: "user",
            content: '你好',
        },
    ],
    model: "gpt-3.5-turbo",
    max_tokens: null,
    temperature: 1,
    presence_penalty: 0,
    top_p: 1,
    frequency_penalty: 0,
    stream: true,
};

// 这里使用无参箭头函数包装，不需要启动后立即执行。
const chat = (requestData) => new Promise((resolve, reject) => {
    if (Object.keys(requestData).length !== 0) {
        requestBodyData = requestData;
    }
    console.info(requestBodyData.messages)
    axios({
        method: 'post',
        url: chatUri,
        data: requestBodyData,
        responseType: 'stream'
    }).then(response => {
        resolve(response);

        response.data.on('data', (chunk) => {
            // const decodedChunk = chunk.toString('UTF-8'); // 将字节转换为 UTF-8 字符串
            // resolve(decodedChunk);
        });
        response.data.on('end', () => {
            // 数据接收完成的逻辑
        });
    }).catch(error => {
        reject(error);
    });
});

module.exports = {
    chat
}