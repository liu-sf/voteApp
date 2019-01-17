var fs = require('fs')
var path = require('path')

var p1 = new Promise(function (resolve,reject) {
    fs.readFile('a.txt','utf-8',function (err,data) {
        if (err){
            reject(err)
        } else {
            resolve(data)
        }
    })
})

p1.then(data => {
    console.log(data)
}).catch(err =>{
    console.log("文件读取失败")
});

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
