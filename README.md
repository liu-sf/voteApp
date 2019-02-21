# voteApp
# 运行方法
# 设置voteApp获得最高权限
$ chmod -R 777 voteApp
$ cd voteApp

# 删除 docker 容器
$ docker rm -f $(docker ps -aq)
# 启动 fabric 的网络
$ ./startFabric.sh
# 安装 node 依赖包
$ npm install
# 注册管理员
$ node enrollAdmin.js
# 注册用户
$ node registerUser.js
# 启动项目
$ node index.js
# 访问 http://localhost:3000
