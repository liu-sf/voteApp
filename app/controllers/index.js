const Fabric_Client = require('fabric-client');
const path = require('path');
const os = require('os')
const util = require('util')
const fs = require('fs');
const bodyParser = require('koa-bodyparser')

// 中间层，用来连接数据库
const Monk = require('monk')
const mongodb = Monk('localhost/test') // test数据库
// 读取table1集合，table2申请单表
const table1 = mongodb.get('table1')
const table2 = mongodb.get('table2')

//申请单编号
let applyMoney_Num = 1



module.exports = {

    async vote(ctx) {
        //获取所有用户的票数
        const title = 'admin page'
        let result = ''

        var fabric_client = new Fabric_Client();
        var key = "name"

        // setup the fabric network
        var channel = fabric_client.newChannel('mychannel');
        var peer = fabric_client.newPeer('grpc://localhost:7051');
        channel.addPeer(peer);

        //
        var member_user = null;
        //	var store_path = path.join(os.homedir(), '.hfc-key-store');
        var store_path = path.join(__dirname, '../hfc-key-store');
        console.log('Store path:' + store_path);
        var tx_id = null;

        // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
        result = await Fabric_Client.newDefaultKeyValueStore({
            path: store_path
        }).then((state_store) => {
            // assign the store to the fabric client
            fabric_client.setStateStore(state_store);
            var crypto_suite = Fabric_Client.newCryptoSuite();
            // use the same location for the state store (where the users' certificate are kept)
            // and the crypto store (where the users' keys are kept)
            var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
            crypto_suite.setCryptoKeyStore(crypto_store);
            fabric_client.setCryptoSuite(crypto_suite);

            // get the enrolled user from persistence, this user will sign all requests
            return fabric_client.getUserContext('user1', true);
        }).then((user_from_store) => {
            if (user_from_store && user_from_store.isEnrolled()) {
                console.log('Successfully loaded user1 from persistence');
                member_user = user_from_store;
            } else {
                throw new Error('Failed to get user1.... run registerUser.js');
            }

            // queryTuna - requires 1 argument, ex: args: ['4'],
            const request = {
                chaincodeId: 'vote',
                txId: tx_id,
                fcn: 'getUserVote',
                args: [""]
            };

            // send the query proposal to the peer
            return channel.queryByChaincode(request);
        }).then((query_responses) => {
            console.log("Query has completed, checking results");
            // query_responses could have more than one  results if there multiple peers were used as targets
            if (query_responses && query_responses.length == 1) {
                if (query_responses[0] instanceof Error) {
                    console.error("error from query = ", query_responses[0]);
                    result = "Could not locate tuna"
                } else {
                    console.log("Response is ", query_responses[0].toString());
                    console.log("channel's name is", channel.getName());
                    console.log("channel's Organizations is", channel.getOrganizations().toString('utf8'));
                    // console.log("*****",typeof(JSON.stringify(channel.getOrderers())));
                    return query_responses[0].toString()
                }
            } else {
                console.log("No payloads were returned from query");
                result = "Could not locate tuna"
            }
        }).catch((err) => {
            console.error('Failed to query successfully :: ' + err);
            result = 'Failed to query successfully :: ' + err

        });



        channel.queryBlockByTxID(1)
            .then(function (data) {
                console.log(data)
            }, function (err) {
                console.log("查询区块txid失败")
            })

        channel.queryInfo()
            .then(function (data) {
                console.log("查询链内高度：")
                console.log(data)
                // console.log(data.height)
            }, function (err) {
                console.log("查询链内高度失败")
            })

        fabric_client.getStateStore().getValue()
            .then(function (data) {
                console.log(data)
            }, function (err) {
                // console.log()
            })

        await ctx.render('vote', {
            title, result
        })
    },

    async saveUser(ctx) {
        //投票
        const queryBody = ctx.request.query;
        const username = queryBody.username;
        console.log("\n");
        console.log(`username.....${username}`)

        var fabric_client = new Fabric_Client();

        // setup the fabric network
        var channel = fabric_client.newChannel('mychannel');
        var peer = fabric_client.newPeer('grpc://localhost:7051');
        channel.addPeer(peer);
        var order = fabric_client.newOrderer('grpc://localhost:7050')
        channel.addOrderer(order);

        var member_user = null;
        //	var store_path = path.join(os.homedir(), '.hfc-key-store');
        var store_path = path.join(__dirname, '../hfc-key-store');
        console.log('Store path:' + store_path);
        var tx_id = null;

        // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
        let result = await Fabric_Client.newDefaultKeyValueStore({
            path: store_path
        }).then((state_store) => {
            // assign the store to the fabric client
            fabric_client.setStateStore(state_store);
            var crypto_suite = Fabric_Client.newCryptoSuite();
            // use the same location for the state store (where the users' certificate are kept)
            // and the crypto store (where the users' keys are kept)
            var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
            crypto_suite.setCryptoKeyStore(crypto_store);
            fabric_client.setCryptoSuite(crypto_suite);

            // get the enrolled user from persistence, this user will sign all requests
            return fabric_client.getUserContext('user1', true);
        }).then((user_from_store) => {
            if (user_from_store && user_from_store.isEnrolled()) {
                console.log('Successfully loaded user1 from persistence');
                member_user = user_from_store;
            } else {
                throw new Error('Failed to get user1.... run registerUser.js');
            }

            // get a transaction id object based on the current user assigned to fabric client
            tx_id = fabric_client.newTransactionID();
            console.log("Assigning transaction_id: ", tx_id._transaction_id);

            // recordTuna - requires 5 args, ID, vessel, location, timestamp,holder - ex: args: ['10', 'Hound', '-12.021, 28.012', '1504054225', 'Hansel'],
            // send proposal to endorser
            const request = {
                //targets : --- letting this default to the peers assigned to the channel
                chaincodeId: 'vote',
                fcn: 'voteUser',
                args: [username],
                chainId: 'mychannel',
                txId: tx_id
            };

            // send the transaction proposal to the peers
            return channel.sendTransactionProposal(request);
        }).then((results) => {
            var proposalResponses = results[0];
            var proposal = results[1];
            let isProposalGood = false;
            if (proposalResponses && proposalResponses[0].response &&
                proposalResponses[0].response.status === 200) {
                isProposalGood = true;
                console.log('Transaction proposal was good');
            } else {
                console.error('Transaction proposal was bad');
            }
            if (isProposalGood) {
                console.log(util.format(
                    'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
                    proposalResponses[0].response.status, proposalResponses[0].response.message));

                // build up the request for the orderer to have the transaction committed
                var request = {
                    proposalResponses: proposalResponses,
                    proposal: proposal
                };

                // set the transaction listener and set a timeout of 30 sec
                // if the transaction did not get committed within the timeout period,
                // report a TIMEOUT status
                var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
                var promises = [];

                var sendPromise = channel.sendTransaction(request);
                promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

                // get an eventhub once the fabric client has a user assigned. The user
                // is required bacause the event registration must be signed
                let event_hub = fabric_client.newEventHub();
                event_hub.setPeerAddr('grpc://localhost:7053');

                // using resolve the promise so that result status may be processed
                // under the then clause rather than having the catch clause process
                // the status
                let txPromise = new Promise((resolve, reject) => {
                    let handle = setTimeout(() => {
                        event_hub.disconnect();
                        resolve({event_status: 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
                    }, 3000);
                    event_hub.connect();
                    event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
                        // this is the callback for transaction event status
                        // first some clean up of event listener
                        clearTimeout(handle);
                        event_hub.unregisterTxEvent(transaction_id_string);
                        event_hub.disconnect();

                        // now let the application know what happened
                        var return_status = {event_status: code, tx_id: transaction_id_string};
                        if (code !== 'VALID') {
                            console.error('The transaction was invalid, code = ' + code);
                            resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
                        } else {
                            console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
                            resolve(return_status);
                        }
                    }, (err) => {
                        //this is the callback if something goes wrong with the event registration or processing
                        reject(new Error('There was a problem with the eventhub ::' + err));
                    });
                });
                promises.push(txPromise);

                return Promise.all(promises);
            } else {
                console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
                throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
            }
        }).then((results) => {
            console.log('Send transaction promise and event listener promise have completed');
            // check the results in the order the promises were added to the promise all list
            if (results && results[0] && results[0].status === 'SUCCESS') {
                console.log('Successfully sent transaction to the orderer.');
                //res.send(tx_id.getTransactionID());
                return tx_id.getTransactionID();
            } else {
                console.error('Failed to order the transaction. Error code: ' + response.status);
            }

            if (results && results[1] && results[1].event_status === 'VALID') {
                console.log('Successfully committed the change to the ledger by the peer');
                //res.send(tx_id.getTransactionID());
                return tx_id.getTransactionID();
            } else {
                console.log('Transaction failed to be committed to the ledger due to ::' + results[1].event_status);
            }
        }).catch((err) => {
            console.error('Failed to invoke successfully :: ' + err);
        });

        ctx.body = result
    },

    async register(ctx) {
        const title = 'register page'
        const message = 'message'
        await ctx.render('register', {title, message})
    },

    async login(ctx) {
        const title = 'login page';
        const message = '';

        // const queryBody = ctx.request.query;
        // const username = queryBody.username;
        // const password = queryBody.password;

        // const body = ctx.request.body;
        // const username = body.username;
        // const password = body.password;
        // console.log('body,'+username);
        // console.log('body,'+password);

        //  console.log(`login_username.....${username}`);
        // console.log(`login_password.....${password}`);
        // console.log("方法，"+ctx.method);
        // ctx.body =  ctx.request.body;
        // console.log("ctx.req,"+ctx.req);
        console.log("*************");


        await ctx.render('login', {title, message});
    },

    async login_post(ctx) {
        console.log('接收到post请求');

        //koa通过bodyparser无法获取ctx.req.body的值，必须通过json转换？转换成json字符串
        var str = JSON.stringify(ctx.request.body);
        var obj = JSON.parse(str);
        var uname = obj.uname;
        var upwd = obj.upwd;
        var jb = {"a": 123, "b": 123, "c": 123};
        console.log('1.' + JSON.stringify(ctx.request.body));
        // console.log('2.'+typeof (JSON.stringify(ctx.request.body)));
        // console.log('3.'+obj.uname);
        // console.log('3.'+obj.upwd);
        ctx.body = {
            status: 200,
            description: 'ok',
            result: str
        };


    },

    async indexPage(ctx) {
        const title = 'index page'
        await ctx.render('index', {
            title
        })
    },

    async test1(ctx) {

        await ctx.render('test1')
    },

    async applyMoney(ctx) {
        await ctx.render('applyMoney')
    },
    async applyMoney_post1(ctx) {
        var apply_time = new Date()
        await ctx.render('applyMoney')
        // var formData = JSON.stringify( ctx.request.body)
        var formData = ctx.request.body
        formData.num = applyMoney_Num++
        formData.apply_time = apply_time.toLocaleString()
        formData.status = false
        console.log("这是post请求！" + formData);
        table1.find()
            .then(data => {
                console.log(data)
                // console.log( JSON.stringify(data))
            }).catch(err => {
            console.log("数据库读取失败")
        })
        table1.insert(formData)
            .then(data => {

            }).catch(err => {
            throw err;
        })

    },
    async applyMoney_post2(ctx) {
        var apply_time = new Date()
        await ctx.render('applyMoney')
        // var formData = JSON.stringify( ctx.request.body)
        var formData = ctx.request.body
        formData.num = applyMoney_Num++
        formData.apply_time = apply_time.toLocaleString()
        formData.status = false
        console.log("这是post请求！" + formData);
        table2.insert(formData)
            .then(data => {

            }).catch(err => {
            throw err;
        })

    },
    async applyList(ctx) {
        await ctx.render('applyList')
    },
    async companyInfo(ctx) {
        var result = await query("supplier")
        await ctx.render('companyInfo', {
            result
        })
    },
    async todoList(ctx) {
        await table2.find()
            .then(data => {
                console.log(data)
                items = data
                // console.log( JSON.stringify(data))
            }).catch(err => {
                console.log("数据库读取失败")
            })
        await ctx.render('todoList', {
            items: items
        })


    },
    async checkDetail(ctx) {
        var id = ctx.query.id;
        var item;
        await table2.findOne(id)
            .then(data => {
                // console.log(data)
                item = data
            }).catch(err => {
                console.log("失败！");
                throw err
            });
        if (ctx.request.method == 'GET') {
            await ctx.render('checkDetail', {
                item
            })
        }
        if (ctx.request.method == "POST") {
            console.log(ctx.request.body);
            console.log(ctx.request.body.status);
            if (ctx.request.body.status == 'true') {
                console.log(item);
                await table2.update(item, {$set: {'status': 'true'}})
                    .then(data => {
                        ctx.body = {status: 200}
                    })
                    .catch(err => {
                        console.log("update failed!");
                        throw err
                    });
                var applyAmount = item.applyAmount
                var invoke_result = await invoke("bank","supplier",applyAmount);
            }
            if (ctx.request.body.status == 'false') {
                console.log(item);
                await table2.update(item, {$set: {'status': 'false'}})
                    .then(data => {
                        ctx.body = {status: 200}
                    })
                    .catch(err => {
                        console.log("update failed!")
                        throw err
                    })
            }
        }
    },
    async test2(ctx) {
        let result = '';
        // var invoke_result = await invoke("supplier","bank","20");
        var supplier_result = await query("supplier");
        var bank_result = await query("bank");
        var keywa_result = await query("keywa");
        // for(i=1;i<2;i++){
        //     var query_blocks = +await block(i);
        //
        // }
        var block_num = await query_blocknum()
        for (i=0;i<block_num;i++){
            var blocks = await query_block(i);
        }
        await ctx.render('test2', {
            supplier_result,bank_result,keywa_result,block_num
        })
    },


}

//查询账户余额操作 args为账户名
function query( ){
    var fabric_client = new Fabric_Client();
    var key = "name"

// setup the fabric network
    var channel = fabric_client.newChannel('mychannel');
    var peer = fabric_client.newPeer('grpc://localhost:7051');
    channel.addPeer(peer);

    var member_user = null;
    var store_path = path.join(__dirname, '../hfc-key-store');
    var tx_id = null;

    return Fabric_Client.newDefaultKeyValueStore({
        path: store_path
    }).then((state_store) => {
        fabric_client.setStateStore(state_store);
        var crypto_suite = Fabric_Client.newCryptoSuite();
        var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
        crypto_suite.setCryptoKeyStore(crypto_store);
        fabric_client.setCryptoSuite(crypto_suite);
        return fabric_client.getUserContext('user1', true);
    }).then((user_from_store) => {
        if (user_from_store && user_from_store.isEnrolled()) {
            console.log('Successfully loaded user1 from persistence');
            member_user = user_from_store;
        } else {
            throw new Error('Failed to get user1.... run registerUser.js');
        }
        const request = {
            chaincodeId: 'chaincode_example02',
            txId: tx_id,
            fcn: 'query',
            args: [arguments[0]]
        };
        // send the query proposal to the peer
        return channel.queryByChaincode(request);
    }).then((query_responses) => {
        console.log("Query has completed, checking results");
        // query_responses could have more than one  results if there multiple peers were used as targets
        if (query_responses && query_responses.length == 1) {
            if (query_responses[0] instanceof Error) {
                console.error("error from query = ", query_responses[0]);
                result = "Could not locate tuna"
            } else {
                console.log("Response is ", query_responses[0].toString());
                return query_responses[0].toString()
            }
        } else {
            console.log("No payloads were returned from query");
            result = "Could not locate tuna"
        }
    }).catch((err) => {
        console.error('Failed to query successfully :: ' + err);
        result = 'Failed to query successfully :: ' + err
    });
}

//转账函数 函数返回tx_id
function invoke(){

        var fabric_client = new Fabric_Client();

        // setup the fabric network
        var channel = fabric_client.newChannel('mychannel');
        var peer = fabric_client.newPeer('grpc://localhost:7051');
        channel.addPeer(peer);
        var order = fabric_client.newOrderer('grpc://localhost:7050')
        channel.addOrderer(order);

        var member_user = null;
        //	var store_path = path.join(os.homedir(), '.hfc-key-store');
        var store_path = path.join(__dirname, '../hfc-key-store');
        console.log('Store path:' + store_path);
        var tx_id = null;

        // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
        return  Fabric_Client.newDefaultKeyValueStore({
            path: store_path
        }).then((state_store) => {
            // assign the store to the fabric client
            fabric_client.setStateStore(state_store);
            var crypto_suite = Fabric_Client.newCryptoSuite();
            // use the same location for the state store (where the users' certificate are kept)
            // and the crypto store (where the users' keys are kept)
            var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
            crypto_suite.setCryptoKeyStore(crypto_store);
            fabric_client.setCryptoSuite(crypto_suite);

            // get the enrolled user from persistence, this user will sign all requests
            return fabric_client.getUserContext('user1', true);
        }).then((user_from_store) => {
            if (user_from_store && user_from_store.isEnrolled()) {
                console.log('Successfully loaded user1 from persistence');
                member_user = user_from_store;
            } else {
                throw new Error('Failed to get user1.... run registerUser.js');
            }

            // get a transaction id object based on the current user assigned to fabric client
            tx_id = fabric_client.newTransactionID();
            console.log("Assigning transaction_id: ", tx_id._transaction_id);

            // recordTuna - requires 5 args, ID, vessel, location, timestamp,holder - ex: args: ['10', 'Hound', '-12.021, 28.012', '1504054225', 'Hansel'],
            // send proposal to endorser
            const request = {
                //targets : --- letting this default to the peers assigned to the channel
                chaincodeId: 'chaincode_example02',
                fcn: 'invoke',
                args: [arguments[0],arguments[1],arguments[2]],
                chainId: 'mychannel',
                txId: tx_id
            };

            // send the transaction proposal to the peers
            return channel.sendTransactionProposal(request);
        }).then((results) => {
            var proposalResponses = results[0];
            var proposal = results[1];
            let isProposalGood = false;
            if (proposalResponses && proposalResponses[0].response &&
                proposalResponses[0].response.status === 200) {
                isProposalGood = true;
                console.log('Transaction proposal was good');
            } else {
                console.error('Transaction proposal was bad');
            }
            if (isProposalGood) {
                console.log(util.format(
                    'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
                    proposalResponses[0].response.status, proposalResponses[0].response.message));

                // build up the request for the orderer to have the transaction committed
                var request = {
                    proposalResponses: proposalResponses,
                    proposal: proposal
                };

                // set the transaction listener and set a timeout of 30 sec
                // if the transaction did not get committed within the timeout period,
                // report a TIMEOUT status
                var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
                var promises = [];

                var sendPromise = channel.sendTransaction(request);
                promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

                // get an eventhub once the fabric client has a user assigned. The user
                // is required bacause the event registration must be signed
                // let event_hub = fabric_client.newEventHub();
                // event_hub.setPeerAddr('grpc://localhost:7053');
                let event_hub = channel.newChannelEventHub('localhost:7051');

                // using resolve the promise so that result status may be processed
                // under the then clause rather than having the catch clause process
                // the status
                let txPromise = new Promise((resolve, reject) => {
                    let handle = setTimeout(() => {
                        event_hub.disconnect();
                        resolve({event_status: 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
                    }, 3000);
                    event_hub.connect();
                    event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
                        // this is the callback for transaction event status
                        // first some clean up of event listener
                        clearTimeout(handle);
                        event_hub.unregisterTxEvent(transaction_id_string);
                        event_hub.disconnect();

                        // now let the application know what happened
                        var return_status = {event_status: code, tx_id: transaction_id_string};
                        if (code !== 'VALID') {
                            console.error('The transaction was invalid, code = ' + code);
                            resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
                        } else {
                            // console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
                            console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
                            resolve(return_status);
                        }
                    }, (err) => {
                        //this is the callback if something goes wrong with the event registration or processing
                        reject(new Error('There was a problem with the eventhub ::' + err));
                    });
                });
                promises.push(txPromise);

                return Promise.all(promises);
            } else {
                console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
                throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
            }
        }).then((results) => {
            console.log('Send transaction promise and event listener promise have completed');
            // check the results in the order the promises were added to the promise all list
            if (results && results[0] && results[0].status === 'SUCCESS') {
                console.log('Successfully sent transaction to the orderer.');
                //res.send(tx_id.getTransactionID());
                return tx_id.getTransactionID();
            } else {
                console.error('Failed to order the transaction. Error code: ' + response.status);
            }

            if (results && results[1] && results[1].event_status === 'VALID') {
                console.log('Successfully committed the change to the ledger by the peer');
                //res.send(tx_id.getTransactionID());
                return tx_id.getTransactionID();
            } else {
                console.log('Transaction failed to be committed to the ledger due to ::' + results[1].event_status);
            }
        }).catch((err) => {
            console.error('Failed to invoke successfully :: ' + err);
        });



}

//查询区块数
function query_blocknum(){
    var fabric_client = new Fabric_Client();
    var key = "name"

// setup the fabric network
    var channel = fabric_client.newChannel('mychannel');
    var peer = fabric_client.newPeer('grpc://localhost:7051');
    channel.addPeer(peer);
    var member_user = null;
    var store_path = path.join(__dirname, '../hfc-key-store');
    var tx_id = null;

    return Fabric_Client.newDefaultKeyValueStore({
        path: store_path
    }).then((state_store) => {
        fabric_client.setStateStore(state_store);
        var crypto_suite = Fabric_Client.newCryptoSuite();
        var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
        crypto_suite.setCryptoKeyStore(crypto_store);
        fabric_client.setCryptoSuite(crypto_suite);
        return fabric_client.getUserContext('user1', true);
    }).then((user_from_store) => {
        if (user_from_store && user_from_store.isEnrolled()) {
            console.log('Successfully loaded user1 from persistence');
            member_user = user_from_store;
        } else {
            throw new Error('Failed to get user1.... run registerUser.js');
        }

        // send the query proposal to the peer
            return channel.queryInfo();
        }).then((data) => {
            //console.log("区块数："+data.height.Long);
            return data.height.low;
    }).catch((err) => {
        console.error('Failed to query blocks successfully :: ' + err);
        result = 'Failed to query blocks successfully :: ' + err
    });
}

//查询区块
function query_block(){
    var fabric_client = new Fabric_Client();
    var key = "name"

// setup the fabric network
    var channel = fabric_client.newChannel('mychannel');
    var peer = fabric_client.newPeer('grpc://localhost:7051');
    channel.addPeer(peer);

    var member_user = null;
    var store_path = path.join(__dirname, '../hfc-key-store');
    var tx_id = null;

    return Fabric_Client.newDefaultKeyValueStore({
        path: store_path
    }).then((state_store) => {
        fabric_client.setStateStore(state_store);
        var crypto_suite = Fabric_Client.newCryptoSuite();
        var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
        crypto_suite.setCryptoKeyStore(crypto_store);
        fabric_client.setCryptoSuite(crypto_suite);
        return fabric_client.getUserContext('user1', true);
    }).then((user_from_store) => {
        if (user_from_store && user_from_store.isEnrolled()) {
            console.log('Successfully loaded user1 from persistence');
            member_user = user_from_store;
        } else {
            throw new Error('Failed to get user1.... run registerUser.js');
        }

        // send the query proposal to the peer
        return channel.queryBlock(arguments[0],peer,skipDecode=false);
    }).then(data =>{
        console.log(data);
        return null;
    }).catch((err) => {
        console.error('Failed to query blocks successfully :: ' + err);
        result = 'Failed to query blocks successfully :: ' + err
    });
}
