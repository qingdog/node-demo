// Can be 'nodejs', but Vercel recommends using 'edge'
export const runtime = 'edge';
// Prevents this route's response from being cached
export const dynamic = 'force-dynamic';

// This method must be named GET
export async function GET() {
    // This encoder will stream your text
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
        start(controller) {
            // Start encoding 'Basic Streaming Test',
            // and add the resulting stream to the queue
            // controller.enqueue(encoder.encode('Basic Streaming Test'));

            // 响应格式
            let resData = {
                "id": "chatcmpl-7xx584ZRr5PxiHRVZKlqYx7vKuRsM",
                "object": "chat.completion.chunk",
                "created": 1694522818,
                "model": "gpt-3.5-turbo-0301",
                "choices": [{
                    "index": 0, "delta": {
                        "role": "assistant", "content": "你好！有什么我可以帮助你的吗？"
                    }, "finish_reason": null
                }]
            }

            let step = 0;
            const time = setInterval(() => {
                if (step < 10) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(resData)}\n\n`));
                } else {
                    resData.choices[resData.choices.length - 1].delta.content = undefined
                    resData.choices[resData.choices.length - 1].finish_reason = 'stop'
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(resData)}\n\n`));

                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                    // Prevent anything else being added to the stream
                    controller.close();

                    clearInterval(time)
                }
                step++;
            }, 100);
        },
    });

    return new Response(readableStream, {
        headers: {'Content-Type': 'text/html; charset=utf-8'},
    });
}

let requestBodyData = {
    messages: [{
        role: "system",
        content: "You are ChatGPT, a large language model trained by OpenAI.\nCarefully heed the user's instructions. \nRespond using Markdown.",
    }, {
        role: "user", content: '你好',
    },],
    model: "gpt-3.5-turbo",
    max_tokens: null,
    temperature: 1,
    presence_penalty: 0,
    top_p: 1,
    frequency_penalty: 0,
    stream: true,
};

let controller // FETCH-SSE 连接控制器
let timer
// 断开 FETCH-SSE 连接
const closeSSE = () => {
    if (controller) {
        controller.abort()
        controller = undefined
        console.warn('FETCH 连接关闭！')
    }
}

// 超时关闭请求
function timeout(time = 100000) {
    timer = setTimeout(() => {
        closeSSE();
        this.ontimeout?.(); // 外部若传入了监听超时回调，类似 onmessage
    }, time);
}

export async function chat(responseBody) {
    let data = responseBody
    if (responseBody?.mes) {
        data = requestBodyData
        data.messages[1].content = responseBody.mes;
    }
    console.info(data.messages?.[data.messages.length - 1])

    // 使用自定义 fetch 发起请求
    const chatApi = process.env.ENV_CHAT_API
    const chatUri = process.env.ENV_CHAT_URI;
    const chatApiSecret = process.env.ENV_CHAT_API_SECRET;

    let unChunck = '';
    const decoder = new TextDecoder();
    const responseReader = await fetchStream(chatApi + chatUri, {
        method: 'POST', headers: {
            Accept: 'text/event-stream',
            Authorization: 'Bearer ' + chatApiSecret,
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Content-Type': 'application/json; charset=UTF-8',
        }, responseType: 'stream', //signal: controller.signal, //fetch接收 controller 的信号用于abort
        body: JSON.stringify(data), // body: data,
        onopen: () => {
            // 连接成功
        }, onmessage: (res) => {// 处理响应数据
            // 分块可能出现不完整的一行，所以和下一次响应的分块拼接后再解析成json格式
            unChunck = parseStreamResponse(unChunck + decoder.decode(res));
            // console.log(res);
        }, onclose: () => {
            // 连接关闭
            console.info(parseResponseJson)
            parseResponseJson = ''
        }
    }).then(responseReader => {
        // 响应完成后执行
        //chatContent.textContent = text;
        // responseStream(responseReader);
        return responseReader
    }).catch((error) => {
        console.error('发生错误：', error);
    })

    return new Response(responseReader, {
        headers: {'Content-Type': 'text/html; charset=UTF-8'},
    });
}

/**
 * 基于fetch 自定义封装的fetch请求
 * @param {*} url 请求链接
 * @param {*} params
 * @returns
 */
const fetchStream = async (url, params) => {
    timeout(); // 开启超时计时器
    const {onopen, onmessage, onclose, ...otherParams} = params;

    return await fetch(url, otherParams)
        .then(async response => {
            clearTimeout(timer); // 拿到结果，清除 timeout 计时器
            if (response.status === 200) {
                onopen?.()
            }

            const reader = response.body.getReader();

            reader.closed.then(value => {
                // 此处若没有定义该函数onclose可不执行
                onclose?.();
                console.info('ReadableStreamDefaultReader.closed.fulfilled......')
            }, reason => {
                console.warn('ReadableStreamDefaultReader.closed.onrejected-读取出错了！')
                console.warn(reason)
            });

            // 这里把fetch的text/event-stream流又套了一层流进行处理 response数据
             return new  ReadableStream({
                async start(controller) {

                    let value;
                    try {
                        const decoder = new TextDecoder('UTF-8');
                        const encoder = new TextEncoder();
                        // controller.enqueue(encoder.encode('data: {"mes": "你好！有什么我可以帮助你的吗？"}\n\n')); //ReadableStream流写入
                        while (!({value} = await reader.read()).done) {
                            // 读取响应流处理
                            onmessage?.(value);
                            // console.log(decoder.decode(value))
                            const code = decoder.decode(value)//.toString('UTF-8')
                            controller.enqueue(encoder.encode(code)); //ReadableStream流写入
                        }
                        // ReadableStream流写入完毕
                        controller.close();
                    } catch (e) {
                        console.error('错误：', e)
                    } finally {
                        reader.releaseLock() //出现异常时需要此处关闭
                    }
                },
            });
            // 之前把数据enqueue入队进入流中了，现在可使用Response进行转换为文本（文本解码），这里只是收集流中所有数据可以不用
            //.then((stream) => new Response(stream, {headers: {'Content-Type': 'text/html'}}).text());
        }).catch(e => {
            console.warn(e)
        }).finally(() => {
        })
};


let parseResponseJson = ''
/**
 * 解析 EventSource 格式为 json
 * @param str
 * @returns {*|string}
 */
const parseStreamResponse = str => {
    // 去除每一行（全局多行匹配gm） "data: " 前缀（如果存在），根据 SSE 规范，每个消息以两个换行符分隔。
    const chunks = str.replace(/^data: ({)/gm, '$1').split('\n\n');
    for (const chunk of chunks) {
        // 分割特性。字符串变成数组后，第一个和最后一个有可能为空字符串
        if ('' === chunk) continue
        try {
            // 头尾换行或空格不影响json解析
            const jsonData = JSON.parse(chunk);
            parseResponseJson += jsonData.choices?.[0]?.delta?.content || ''
        } catch (error) {
            if ('\n' === chunk || chunk.startsWith(':')) continue
            if ('data: [DONE]' === chunk) {
                // console.info('流已完成！' + chunk)
                return '';
            }
            // console.warn('JSON解析失败：', chunk);
            return chunk;
        }
    }
    return '';
}
