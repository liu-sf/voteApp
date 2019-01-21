const Koa = require('koa');
const app = new Koa();

const routers = require('./routers/index')
const views = require('koa-views')
const path = require('path')
const koaBody = require('koa-body')
const bodyParser = require('koa-bodyparser')
// const bodyParser = require('body-parser')



// 使用ctx.body解析中间件
app.use(koaBody());
app.use(bodyParser());
// app.use(bodyParser.json());//数据JSON类型
// app.use(bodyParser.urlencoded({ extended: false }));//解析post请求数据

// 加载模板引擎
app.use(views(path.join(__dirname, './views'), {
//  extension: 'ejs'
      map : {html:'ejs'}
}))

app.use(routers.routes()).use(routers.allowedMethods());


app.listen(3000);