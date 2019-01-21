const Koa = require('koa');
const app = new Koa();

const routers = require('./routers/index')
const views = require('koa-views')
const path = require('path')
const koaBody = require('koa-body')
const bodyParser = require('koa-bodyparser')

// 中间层，用来连接数据库
const Monk = require('monk')
const mongodb = Monk('localhost/runoob') // test就是你的数据库
// 读取user集合
const user = mongodb.get('site')

// 使用ctx.body解析中间件
app.use(koaBody());
app.use(bodyParser());

// 加载模板引擎
app.use(views(path.join(__dirname, './views'), {
//  extension: 'ejs'
      map : {html:'ejs'}
}))

app.use(routers.routes()).use(routers.allowedMethods());


app.listen(3000);