export default async (req, res) => {
    const { pathname, query } = req;
    if (pathname.startsWith('/proxy')) {
        // 处理代理请求
        // 这里你可以在 Edge Functions 中直接发送请求到目标地址
        // 例如使用 fetch() 函数
        // 例如：
        const response = await fetch('目标地址');
        const data = await response.json();
        res.json(data);
    } else if (pathname === '/api') {
        // 处理 /api 路径
        res.setHeader('Content-Type', 'application/json;charset=utf-8');
        const chatApi = process.env.ENV_CHAT_API;
        res.json({'secret-edge': chatApi});
    } else if (pathname.startsWith('/v1')) {
        // 使用 v1 路由
        await v1(req, res);
    } else {
        // 处理其他未匹配的路径
        // 这里你可以返回 404 或者其他自定义的响应
        // 例如：
        res.status(404).send('Not Found');
    }
};


// fix.https://github.com/vercel/ai/issues/239
// ref.https://github.com/vercel/vercel/blob/main/packages/node/src/index.ts#L495-L511
export const config = {
    // supportsResponseStreaming只能使用export语法
    supportsResponseStreaming: true,
}

// export default app;