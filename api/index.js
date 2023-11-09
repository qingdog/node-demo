import {GET, chat} from '../router/v1-edge'
export const config = {
    runtime: 'edge',
    supportsResponseStreaming: true,
};
export default async function handler(request) {
    const urlParams = new URL(request.url).searchParams;
    const query = Object.fromEntries(urlParams);
    const cookies = request.headers.get('cookie');
    let body;

    const path = new URL(request.url).pathname


    let data = null;
    if (path.match('^/api/?$')) {
        const chatApi = process.env.ENV_CHAT_API;
        data = {'secret': chatApi}
        console.log(data)
    } else if (path.match('^/v1/?$')) {
        return await GET();
    }  else if (path.match('^/v1/')) {
        try {
            body = await request.json();
        } catch (e) {
            body = null;
        }
        return await chat(body);
    } else {
        console.log(false)
    }



    data = data || {
        body,
        path,
        query,
        cookies,
        urlParams,
    };
    return new Response(
        JSON.stringify(data),
        {
            status: 200,
            headers: {
                'content-type': 'application/json',
            },
        },
    );
}
