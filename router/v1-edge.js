// Can be 'nodejs', but Vercel recommends using 'edge'
export const runtime = 'edge';
// Prevents this route's response from being cached
export const dynamic = 'force-dynamic';

// This method must be named GET
export async function GET() {
    // This encoder will stream your text
    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
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

            let step = 0;
            const time = setInterval(() => {
                if (step <= 18) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(resData)}\n\n`));
                } else if (step === 19) {
                    resData.choices[resData.choices.length - 1].delta.content = undefined
                    resData.choices[resData.choices.length - 1].finish_reason = 'stop'
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(resData)}\n\n`));
                } else if (step === 20) {
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                    // Prevent anything else being added to the stream

                    controller.close();
                    clearInterval(time)
                }
                step++;
            }, 100);
        },
    });

    return new Response(customReadable, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

}
