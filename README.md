# voteApp
# 运行方法
## 设置voteApp获得最高权限
$ chmod -R 777 voteApp
$ cd voteApp
$ cd basic-network
## 关闭清除网络
$ ./teardown.sh
## 重新生成区块链网络的证书、工具等,再手动修改docker-compose.yml中的FABRIC_CA_SERVER_CA_KEYFILE值
$ ./generate.sh
## 启动 fabric 的网络
$ ./startFabric.sh

$ cd ../app
## 重新安装 node 依赖包
$ npm install
## 注册管理员
$ node enrollAdmin.js
## 注册用户
$ node registerUser.js
## 启动项目
$ node index.js
## 访问 http://localhost:3000
