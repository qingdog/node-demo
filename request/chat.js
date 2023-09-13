import axios from '../util/myaxios.js'


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
export const chat = (requestData) => new Promise((resolve, reject) => {
    if (Object.keys(requestData).length !== 0) {
        requestBodyData = requestData;
    }
    console.info(requestBodyData.messages?.[requestBodyData.messages.length - 1])

    const chatUri = process.env.ENV_CHAT_URI;
    axios({
        method: 'POST',
        url: chatUri,
        data: requestBodyData,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        },
        responseType: 'stream'
    }).then(response => {
        // console.error(response.data)
        // console.error(typeof(response.data))

        resolve(response);

        // response.data.on('data', (chunk) => {
        //     // const decodedChunk = chunk.toString('UTF-8'); // 将字节转换为 UTF-8 字符串
        //     // resolve(decodedChunk);
        //     const decodedChunk = chunk.toString('UTF-8');
        //     console.log(decodedChunk)
        //     console.log('-------')
        // });
        // response.data.on('end', () => {
        //
        //     // 数据接收完成的逻辑
        // });
    }).catch(error => {
        reject(error);
    });
});
