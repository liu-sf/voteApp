var fs = require('fs')
var path = require('path')
// var MongoClient = require('mongodb').MongoClient;
// var url = "mongodb://localhost:27017/";

var mydate = new Date()
console.log(mydate.toLocaleString())
// MongoClient.connect(url, function (err, db) {
//     if (err) throw err;
//     var dbase = db.db("runoob");
//     var myobj = { name: "菜鸟教程", url: "www.runoob" };
//     //创建了site集合，也就是site表
//     // dbase.createCollection('site', function (err, res) {
//     //     if (err) throw err;
//     //     console.log("创建集合!");
//     //     db.close();
//     // });
//     dbase.collection("site").insertOne(myobj, function(err, res) {
//         if (err) throw err;
//         console.log("文档插入成功");
//         db.close();
//     });
// });


// var p1 = new Promise(function (resolve,reject) {
//     fs.readFile('a.txt','utf-8',function (err,data) {
//         if (err){
//             reject(err)
//         } else {
//             resolve(data)
//         }
//     })
// })
//
// p1.then(data => {
//     console.log(data)
// }).catch(err =>{
//     console.log("文件读取失败")
// });

// var path1 = path.join(__dirname,'b')
// console.log(path1)
//
//
// fs.writeFile(path1, 'Hello Node', function (err) {
//     if (err) throw err;
//     console.log('It\'s saved!');
// });
// fs.readFile('xxx.txt', function (err, data) {
//     if (err) throw err;
//     console.log(data);
// });
