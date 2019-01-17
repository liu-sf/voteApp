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
module.exports = router