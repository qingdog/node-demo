> 遗留问题：edge function边缘函数跨域问题。
> 
> serverful 无服务器函数在hobby爱好者计划响应时长最长10s

[vercel] https://vercel.com/docs/functions/serverless-functions/runtimes/node-js#using-express-with-vercel

## 将 Express.js 与 Vercel 结合使用

### Next.js
我们建议使用 API 路由 和 Next.js 来创建 无服务器函数。

该文件夹内的任何文件 pages/api 都会映射到 /api/* 并将被视为 API 端点，而不是 page. 例如，以下 API 路由 pages/api/user.js 处理 json 响应：

```js
export default function handler(req, res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({ name: 'John Doe' });
}
```

Next.js API 路由 page/api/user.js 示例。

API 路由提供内置中间件来解析传入请求 ( req)。这些中间件是：

* req.cookies - 包含请求发送的 cookie 的对象。默认为 {} 
* req.query- 包含查询字符串的 对象 。默认为 {} 
* req.body - 包含由 解析的正文的对象 content-type，或者 null 如果没有发送正文
还支持 其他中间件。

### 独立的 Express
您还可以使用 Vercel 创建独立的 Express.js 应用程序。首先，创建一个文件 index.js 并将其添加到 /api 文件夹中。这类似于 serverful Express.js 应用程序中的app.js 文件 。该 /api 目录是我们添加无服务器函数的位置。

```js
const app = require('express')();
const { v4 } = require('uuid');

app.get('/api', (req, res) => {
  const path = `/api/item/${v4()}`;
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
  res.end(`Hello! Go to item: <a href="${path}">${path}</a>`);
});

app.get('/api/item/:slug', (req, res) => {
  const { slug } = req.params;
  res.end(`Item: ${slug}`);
});

module.exports = app;
```

示例 Express.js API 路由 api/index.js。

请注意，我们 setHeader 为我们的 Cache-Control. 这描述了我们资源的生命周期，告诉 CDN 从缓存中提供服务 并在后台更新（最多每秒一次）。

让我们添加一个 重写 ，将所有流量推送到我们的 index.js. vercel.json 在项目的根目录添加 来指定应用程序的行为。请参阅 CLI 文档以了解如何自定义 Vercel 项目。


```json
{
  "rewrites": [{ "source": "/api/(.*)", "destination": "/api" }]
}
```

添加对 vercel.json 的重写。

添加公共目录
为了提供静态内容，我们通常会 app.use(express.static('public')) 在主文件中 执行此操作app.js。相反，我们可以将一个 /public 文件夹添加到根目录。

使用 Vercel 提供静态文件使我们能够进行 静态资产提升 并推送到我们的 全球边缘网络。我们建议使用此方法而不是 express.static.
