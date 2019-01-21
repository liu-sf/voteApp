const router = require('koa-router')()
const IndexController = require('./../controllers/index')
const bodyParser = require('koa-bodyparser')


router.get('/',IndexController.indexPage)
    .get('/saveUser', IndexController.saveUser)
    .get('/login',IndexController.login)
    .post('/login',bodyParser(),IndexController.login_post)
    .get('/vote',IndexController.vote)
    .get('/register',IndexController.register)
    .get('/test1',IndexController.test1)
    .get('/test2',IndexController.test2)
    .get('/applyMoney.html',IndexController.applyMoney)
    .post('/applyMoney_post1',IndexController.applyMoney_post1)
    .post('/applyMoney_post2',IndexController.applyMoney_post2)
    .get('/applyList.html',IndexController.applyList)
    .get('/companyInfo.html',IndexController.companyInfo)
    .get('/todoList.html',IndexController.todoList)



module.exports = router