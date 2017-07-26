const express = require('express');
const UserRouter = express.Router();

// 获取数据库
const mongoose = require('mongoose');
const conn = mongoose.sevens_conn;

// 获取Models
const UserSchema = require('../models/UserSchema');
const UserModel = conn.model('users', UserSchema);
const MemorySchema = require('../models/MemorySchema');
const MemoryModel = conn.model('memorys', MemorySchema);

// 处理复杂的文件上传、下载
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();

// 获取其他资源
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json'));  // 这里的相对路径是相对于server_app这个文件夹
const TimeUtil = require("../models/TimeUtil.js");

// UserRouter的Handler
const UserHandler = {
    login: function(req, res) {
        UserModel.findOne({ _id: req.body.account }, function(err, user) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            if (!user) {
                res.send({
                    ok: false,
                    errMsg: "账户不存在"
                });
                return;
            }
            if (user.password != req.body.password) {
                res.send({
                    ok: false,
                    errMsg: "密码错误"
                });
                return;
            }
            res.send({
                ok: true
            });
        });
    },

    register: function(req, res) {
        UserModel.findOne({ _id: req.body.account }, function(err, user) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            else if (user) {
                res.send({
                    ok: false,
                    errMsg: "该账户已被注册"
                });
                return;
            }
            var newUser = new UserModel();
            newUser._id = req.body.account;
            newUser.password = req.body.password;
            newUser.username = req.body.account;
            newUser.save(function(err) {
                if (err) {
                    res.send({
                        ok: false,
                        errMsg: err
                    });
                }
                else {
                    res.send({
                        ok: true
                    });
                }
            });
        });
    },
    
    get_username: function(req, res){
        UserModel.findOne({ _id: req.body.account }, function(err, user) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            if (!user) {
                res.send({
                    ok: false,
                    errMsg: "用户名不存在"
                });
                return;
            }
            res.send({
                ok: true,
                username: user.username
            });
        });
    },
    
    get_user_info: function(req, res) {
        UserModel.findOne({ _id: req.body.account }, function(err, user) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            if (!user) {
                res.send({
                    ok: false,
                    errMsg: "账户不存在"
                });
                return;
            }
            var sex;
            if (user.sex == 1) {
                sex = "男";
            }
            else if (user.sex == 2) {
                sex = "女";
            }
            else {
                sex = "未填写";
            }
            var birthday = TimeUtil.toDateString(user.birthday);
            res.send({
                ok: true,
                account: req.body.account,
                username: user.username,
                introduction: user.introduction,
                birthday: birthday,
                sex: sex
            });
        });
    },
    
    modify_user_info: function(req, res) {
        if (req.body.sex == "男") {
            req.body.sex = 1;
        }
        else if (req.body.sex == "女") {
            req.body.sex = 2;
        }
        else {
            req.body.sex = 0;
        }
        req.body.birthday = new Date(req.body.birthday);
        var account = req.body.account;
        delete req.body.account;
        if (req.body.username != null) {
            // 如果修改username
            UserModel.findOne({ username: req.body.username }, function(err, user) {
                if (err) {
                    console.error(err);
                    res.send({
                        ok: false,
                        errMsg: "服务器出错"
                    });
                    return;
                }
                if (user && account != user._id) {

                    console.log(user);
                    res.send({
                        ok: false,
                        errMsg: "用户名已存在"
                    });
                    return;
                }


                UserModel.findOneAndUpdate(
                    { _id: account },
                    {
                        $set: req.body
                    },
                    function(err) {
                        if (err) {
                            console.error(err);
                            res.send({
                                ok: false,
                                errMsg: "服务器出错"
                            });
                            return;
                        }
                        res.send({
                            ok: true
                        });
                    });
            });
        }
        else {
            UserModel.findOneAndUpdate(
                { _id: account },
                {
                    $set: req.body
                },
                function(err) {
                    if (err) {
                        console.error(err);
                        res.send({
                            ok: false,
                            errMsg: "服务器出错"
                        });
                        return;
                    }
                    res.send({
                        ok: true
                    });
                });
        }
    },
    
    get_user_face: function(req, res) {
        var filePath = config.user_path + '/faces/' + req.body.account + '.png';
        fs.exists(filePath, function(exist) {
            if (exist) res.download(filePath);
            else {
                var defaultUserFace = config.user_path + '/faces/_sevens_.png';
                res.download(defaultUserFace);
            }
        });
    },
    
    set_user_face: function(req, res) {
        var info = JSON.parse(req.body.null);
        var dirPath = config.user_path + '/faces/';
        var fileName = info.account + ".png";
        fs.rename(req.files["0"].path, dirPath + fileName, function(err) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            res.send({
                ok: true
            });
        });
    },
    
    add_follow: function(req, res) {
        UserModel.findOne(
            {
                _id: req.body.myAccount,
                "followings._id": req.body.otherAccount
            },
            function(err, user) {
                if (err) {
                    console.error(err);
                    res.send({
                        ok: false,
                        errMsg: "服务器出错"
                    });
                    return;
                }
                if (user) {
                    res.send({
                        ok: false,
                        errMsg: "你已关注过此人"
                    });
                    return;
                }

                var flag = true;
                // 更新我的关注列表
                var p1 = new Promise(function(resolve, reject) {
                    UserModel.findOneAndUpdate(
                        { _id: req.body.myAccount },
                        { $push: {
                            followings: {
                                _id: req.body.otherAccount
                            }}
                        },
                        function(err) {
                            if (err) {
                                console.error(err);
                                reject("服务器出错");
                                return;
                            }
                            resolve();
                        });
                });
                // 更新他的被关注列表
                var p2 = new Promise(function(resolve, reject) {
                    UserModel.findOneAndUpdate(
                        { _id: req.body.otherAccount },
                        {
                            $push: { followeds: {
                                _id: req.body.myAccount
                            }}
                        },
                        function(err) {
                            if (err) {
                                console.error(err);
                                reject("服务器出错");
                                return;
                            }
                            resolve();
                        });
                });
                // 两者全部完成后
                Promise.all([p1, p2]).then(function() {
                    res.send({
                        ok: true
                    });
                }).catch(function(err) {
                    res.send({
                        ok: false,
                        errMsg: err
                    });
                });
            });
    },
    
    delete_follow: function(req, res) {
        UserModel.findOne(
            {
                _id: req.body.myAccount,
                "followings._id": req.body.otherAccount
            },
            function(err, user) {
                if (err) {
                    console.error(err);
                    res.send({
                        ok: false,
                        errMsg: "服务器出错"
                    });
                    return;
                }
                if (!user) {
                    res.send({
                        ok: false,
                        errMsg: "你还没关注过此人"
                    });
                    return;
                }

                // 更新我的关注列表
                var p1 = new Promise(function(resolve, reject) {
                    UserModel.findOneAndUpdate(
                        { _id: req.body.myAccount },
                        { $pull: {
                            followings: {
                                _id: req.body.otherAccount
                            }}
                        },
                        function(err) {
                            if (err) {
                                console.error(err);
                                reject("服务器出错");
                                return;
                            }
                            resolve();
                        });
                });
                // 更新他的被关注列表
                var p2 = new Promise(function(resolve, reject) {
                    UserModel.findOneAndUpdate(
                        { _id: req.body.otherAccount },
                        {
                            $pull: { followeds: {
                                _id: req.body.myAccount
                            }}
                        },
                        function(err) {
                            if (err) {
                                console.error(err);
                                reject("服务器出错");
                                return;
                            }
                            resolve();
                        });
                });
                // 两者全部完成后
                Promise.all([p1, p2]).then(function() {
                    res.send({
                        ok: true
                    });
                }).catch(function(err) {
                    res.send({
                        ok: false,
                        errMsg: err
                    });
                });
            });
    },

    like_memory: function(req, res) {
        MemoryModel.findOne(
            {
                _id: req.body.memoryId,
                "likers._id": req.body.account
            },
            function(err, memory) {
                if (err) {
                    console.error(err);
                    res.send({
                        ok: false,
                        errMsg: "服务器出错"
                    });
                    return;
                }
                if (memory) {
                    res.send({
                        ok: false,
                        errMsg: "你已经点赞过这条忆单了"
                    });
                    return;
                }

                MemoryModel.findOneAndUpdate(
                    { _id: req.body.memoryId },
                    { $push: {
                        likers: {
                            _id: req.body.account
                        }
                    }},
                    function(err) {
                        if (err) {
                            console.error(err);
                            res.send({
                                ok: false,
                                errMsg: "服务器出错"
                            });
                            return;
                        }
                        res.send({
                            ok: true
                        });
                    });
            }
        );
    },

    unlike_memory: function(req, res) {
        MemoryModel.findOne(
            {
                _id: req.body.memoryId,
                "likers._id": req.body.account
            },
            function(err, memory) {
                if (err) {
                    console.error(err);
                    res.send({
                        ok: false,
                        errMsg: "服务器出错"
                    });
                    return;
                }
                if (!memory) {
                    res.send({
                        ok: false,
                        errMsg: "你还没有点赞这条忆单"
                    });
                    return;
                }

                MemoryModel.findOneAndUpdate(
                    { _id: req.body.memoryId },
                    { $pull: { likers: { _id: req.body.account }}},
                    function(err) {
                        if (err) {
                            console.error(err);
                            res.send({
                                ok: false,
                                errMsg: "服务器出错"
                            });
                            return;
                        }
                        res.send({
                            ok: true
                        });
                    });
            }
        );
    },

    collect_memory: function(req, res) {
        // 判断是否收藏自己写的忆单
        var p1 = new Promise(function(resolve, reject) {
            MemoryModel.findOne({_id:req.body.memoryId}, function(err, memory) {
                if (err) {
                    console.error(err);
                    reject("服务器出错");
                    return;
                }
                if (!memory) {
                    reject("该忆单不存在");
                    return;
                }
                if (memory.author == req.body.account) {
                    reject("自己的忆单不用收藏嗯");
                    return;
                }
                resolve();
            });
        });

        // 判断是否已经收藏过该忆单
        var p2 = new Promise(function(resolve, reject) {
            UserModel.findOne(
                {
                    _id: req.body.account,
                    "collectedMemorys._id": req.body.memoryId
                },
                function(err, user) {
                    if (err) {
                        console.error(err);
                        reject("服务器出错");
                        return;
                    }
                    if (user) {
                        reject("你已经收藏过这条忆单了");
                        return;
                    }
                    resolve();
                });
        });

        Promise.all([p1, p2]).then(function() {
            // 更新忆单的被收藏列表
            var p3 = new Promise(function(resolve, reject) {
                MemoryModel.findOneAndUpdate(
                    { _id: req.body.memoryId },
                    {
                        $push: {
                            collectors: {
                                _id: req.body.account
                            }
                        }
                    },
                    function(err) {
                        if (err) {
                            console.error(err);
                            reject("服务器出错");
                            return;
                        }
                        resolve();
                    });
            });

            // 更新用户的收藏忆单列表
            var p4 = new Promise(function(resolve, reject) {
                UserModel.findOneAndUpdate(
                    { _id: req.body.account },
                    {
                        $push: {
                            collectedMemorys: {
                                _id: req.body.memoryId,
                                timeForMe: new Date(req.body.time)
                            }
                        }
                    },
                    function(err) {
                        if (err) {
                            console.error(err);
                            reject("服务器出错");
                            return;
                        }
                        resolve();
                    });
            });

            Promise.all([p3, p4]).then(function() {
                res.send({
                    ok: true
                });
            }).catch(function(err) {
                res.send({
                    ok: false,
                    errMsg: err
                });
            });
        }).catch(function(err) {
            res.send({
                ok: false,
                errMsg: err
            });
        });
    },

    uncollect_memory: function(req, res) {
        UserModel.findOne(
            {
                _id: req.body.account,
                "collectedMemorys._id": req.body.memoryId
            },
            function(err, user) {
                if (err) {
                    console.error(err);
                    res.send({
                        ok: false,
                        errMsg: "服务器出错"
                    });
                    return;
                }
                if (!user) {
                    res.send({
                        ok: false,
                        errMsg: "你还没收藏这条忆单"
                    });
                    return;
                }

                // 更新忆单的被收藏列表
                var p1 = new Promise(function(resolve, reject) {
                    MemoryModel.findOneAndUpdate(
                        { _id: req.body.memoryId },
                        {
                            $pull: {
                                collectors: {
                                    _id: req.body.account
                                }
                            }
                        },
                        function(err) {
                            if (err) {
                                console.error(err);
                                reject("服务器出错");
                                return;
                            }
                            resolve();
                        });
                });

                // 更新用户的收藏忆单列表
                var p2 = new Promise(function(resolve, reject) {
                    UserModel.findOneAndUpdate(
                        { _id: req.body.account },
                        {
                            $pull: {
                                collectedMemorys: {
                                    _id: req.body.memoryId
                                }
                            }
                        },
                        function(err) {
                            if (err) {
                                console.error(err);
                                reject("服务器出错");
                                return;
                            }
                            resolve();
                        });
                });

                Promise.all([p1, p2]).then(function() {
                    res.send({
                        ok: true
                    });
                }).catch(function(err) {
                    res.send({
                        ok: false,
                        errMsg: err
                    });
                });
            });



    },

    get_memory_count: function(req, res) {
        UserModel.findOne({ _id: req.body.account }, function(err, user) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            if (!user) {
                res.send({
                    ok: false,
                    errMsg: "账户不存在"
                });
                return;
            }

            res.send({
                ok: true,
                memoryCount: user.memorys.length
            });
        });
    },

    if_like_memory: function(req, res) {
        MemoryModel.findOne(
            {
                _id: req.body.memoryId,
                "likers._id": req.body.account
            },
            function(err, memory) {
                if (err) {
                    console.error(err);
                    res.send({
                        ok: false,
                        errMsg: "服务器出错"
                    });
                    return;
                }
                if (!memory) {
                    res.send({
                        ok: false,
                        errMsg: "还未点赞该忆单"
                    });
                    return;
                }
                res.send({
                    ok: true
                });
            })
    },

    if_collect_memory: function(req, res) {
        MemoryModel.findOne(
            {
                _id: req.body.memoryId,
                "collectors._id": req.body.account
            },
            function(err, memory) {
                if (err) {
                    console.error(err);
                    res.send({
                        ok: false,
                        errMsg: "服务器出错"
                    });
                    return;
                }
                if (!memory) {
                    res.send({
                        ok: false,
                        errMsg: "还未收藏该忆单"
                    });
                    return;
                }
                res.send({
                    ok: !!memory
                })
            })
    },

    get_following_list: function(req, res) {
        UserModel.findOne({ _id: req.body.account }, function(err, user) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            if (!user) {
                res.send({
                    ok: false,
                    errMsg: "账户不存在"
                });
                return;
            }
            var followingString = "";
            for (var i = 0; i < user.followings.length - 1; ++i) {
                followingString += user.followings[i]._id + ",";
            }
            if (user.followings.length > 0) {
                followingString += user.followings[user.followings.length - 1]._id;
            }
            res.send({
                ok: true,
                list: followingString
            });
        });
    },

    get_memory_list: function(req, res) {
        UserModel.findOne({ _id: req.body.account }, function(err, user) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            if (!user) {
                res.send({
                    ok: false,
                    errMsg: "账户不存在"
                });
                return;
            }
            var memoryString = "";  // 如果不初始化为""则最终字符串会多出一个undefined
            for (var i = 0; i < user.memorys.length - 1; ++i) {
                memoryString += user.memorys[i]._id + ",";
            }
            if (user.memorys.length > 0) {
                memoryString += user.memorys[user.memorys.length - 1]._id;
            }
            res.send({
                ok: true,
                list: memoryString
            });
        });
    },

    get_rest_memory_list: function(req, res) {
        UserModel.findOne({ _id: req.body.account }, function(err, user) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            if (!user) {
                res.send({
                    ok: false,
                    errMsg: "账户不存在"
                });
                return;
            }
            var begin = false;
            var memoryIds = [];
            for (var i = 0; i < user.memorys.length; ++i) {
                if (user.memorys[i]._id == req.body.memoryId) {
                    begin = true;
                    continue;
                }
                if (begin) {
                    memoryIds.push(user.memorys[i]._id);
                }
            }
            res.send({
                ok: true,
                list: memoryIds.toString()
            });
        });
    },

    get_collect_memory_list: function(req, res) {
        UserModel.findOne({ _id: req.body.account }, function(err, user) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            if (!user) {
                res.send({
                    ok: false,
                    errMsg: "账户不存在"
                });
                return;
            }
            var memoryString = "";  // 如果不初始化为""则最终字符串会多出一个undefined
            var memorys = user.collectedMemorys;
            for (var i = 0; i < memorys.length - 1; ++i) {
                memoryString += memorys[i]._id + ",";
            }
            if (memorys.length > 0) {
                memoryString += memorys[memorys.length - 1]._id;
            }
            res.send({
                ok: true,
                list: memoryString
            });
        });
    },

    get_futures_for_me: function(req, res) {
        UserModel.findOne({_id: req.body.account}, function(err, user) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            if (!user) {
                res.send({
                    ok: false,
                    errMsg: "该用户不存在"
                });
                return;
            }
            var listString = "";  // 如果不初始化为""则最终字符串会多出一个undefined
            for (var i = 0; i < user.futuresForMe.length - 1; ++i) {
                listString += user.futuresForMe[i]._id + ",";
            }
            if (user.futuresForMe.length > 0) {
                listString += user.futuresForMe[user.futuresForMe.length - 1]._id;
            }
            res.send({
                ok: true,
                list: listString
            });
        });
    },

    get_futures_from_me: function(req, res) {
        UserModel.findOne({_id: req.body.account}, function(err, user) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            if (!user) {
                res.send({
                    ok: false,
                    errMsg: "该用户不存在"
                });
                return;
            }
            var listString = "";  // 如果不初始化为""则最终字符串会多出一个undefined
            for (var i = 0; i < user.futures.length - 1; ++i) {
                listString += user.futures[i]._id + ",";
            }
            if (user.futures.length > 0) {
                listString += user.futures[user.futures.length - 1]._id;
            }
            res.send({
                ok: true,
                list: listString
            });
        });
    }
};

// 登录
UserRouter.post('/login', UserHandler.login);

// 注册
UserRouter.post('/register', UserHandler.register);

// 根据account获取username
UserRouter.post('/get-username', UserHandler.get_username);

// 获取用户信息
UserRouter.post('/get-user-info', UserHandler.get_user_info);

// 修改用户信息
UserRouter.post('/modify-user-info', UserHandler.modify_user_info);

// 获取用户头像
UserRouter.post('/get-user-face', UserHandler.get_user_face);

// 设置用户头像
UserRouter.post('/set-user-face', multipartMiddleware, UserHandler.set_user_face);

// 添加关注
UserRouter.post('/add-follow', UserHandler.add_follow);

// 删除关注
UserRouter.post('/delete-follow', UserHandler.delete_follow);

// 点赞忆单
UserRouter.post('/like-memory', UserHandler.like_memory);

// 取消点赞忆单
UserRouter.post('/unlike-memory', UserHandler.unlike_memory);

// 收藏忆单
UserRouter.post('/collect-memory', UserHandler.collect_memory);

// 取消收藏忆单
UserRouter.post('/uncollect-memory', UserHandler.uncollect_memory);

// 获取用户忆单的总数目
UserRouter.post('/get-memory-count', UserHandler.get_memory_count);

// 判断是否已点赞忆单
UserRouter.post('/if-like-memory', UserHandler.if_like_memory);

// 判断是否已收藏忆单
UserRouter.post('/if-collect-memory', UserHandler.if_collect_memory);

// 获取关注的用户id列表
UserRouter.post('/get-following-list', UserHandler.get_following_list);

// 获取用户的忆单id列表
UserRouter.post('/get-memory-list', UserHandler.get_memory_list);

// 获取剩下忆单id列表
UserRouter.post('/get-rest-memory-list', UserHandler.get_rest_memory_list);

// 获取我收藏的忆单列表
UserRouter.post('/get-collect-memory-list', UserHandler.get_collect_memory_list);

// 获取给我的时光囊列表
UserRouter.post('/get-futures-for-me', UserHandler.get_futures_for_me);

// 获取给我写的时光囊列表
UserRouter.post('/get-futures-from-me', UserHandler.get_futures_from_me);

module.exports = UserRouter;