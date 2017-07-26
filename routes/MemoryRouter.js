const express = require('express');
const MemoryRouter = express.Router();

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
const TimeTool = require("../models/TimeUtil.js");

// MemoryRouter的Handler
const MemoryHandler = {
    add_memory: function(req, res) {
        // req.body.null是JSON字符串
        var memoryInfo = JSON.parse(req.body.null);

        // 新建memory
        var memory = new MemoryModel();
        memory.title = memoryInfo.title;
        memory.author = memoryInfo.author;
        memory.time = Date.parse(memoryInfo.time);
        var labels_ = memoryInfo.labels.split(",");
        var labels = [];
        for (var i = 0; i < labels_.length; ++i) {
            labels.push({
                label: labels_[i]
            });
        }
        memory.labels = labels;
        memory.description = memoryInfo.description;
        memory.content = memoryInfo.content;
        memory.authority = memoryInfo.authority;
        memory.save(function(err) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            // 更新用户忆单列表
            UserModel.findOneAndUpdate(
                { account: memoryInfo.author },
                { $push: { memorys: { id: memory.id }}},
                function(err) {
                    if (err) {
                        console.error(err);
                        res.send({
                            ok: false,
                            errMsg: "服务器出错"
                        });
                    }
                    UserModel.findOneAndUpdate(
                        { _id: memory.author },
                        {
                            $push: {
                                memorys: {
                                    _id: memory._id
                                }
                            }
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
                        }
                    );
                });
        });

        // 创建忆单图片文件夹
        var dirPath = config.memory_path + "/" + memory._id + '/';
        var count = 0;
        var promises = [];
        fs.mkdir(dirPath, function(err) {
            if (err) {
                console.error(err);
                return;
            }

            for (let key in req.files) {
                let fileName = count++ + '.png';
                // 重命名并移动文件
                var p = new Promise(function(resolve, reject) {
                    fs.rename(req.files[key].path, dirPath + fileName, function(err) {
                        if (err) {
                            console.error(err);
                            reject();
                        }
                        else resolve();

                        // smushit.smushit(dirPath + fileName);
                    });
                });
                promises.push(p);
            }
        });
        Promise.all(promises).then(function() {
            // imagemin([dirPath + '*.{jpg,png}'], dirPath + 'build', {
            //     plugins: [
            //         imageminMozjpeg({targa: true}),
            //         imageminPngquant({quality: '10'})
            //     ]
            // }).then(function(files) {
            //     console.log(files);
            // }).catch(function(err) {
            //     console.error(err);
            // });
        }).catch(function(err) {
            console.error(err);
        });
    },

    get_memory: function(req, res) {
        MemoryModel.findOne({ _id: req.body.memoryId }, function(err, memory) {
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
                    errMsg: "忆单不存在"
                });
                return;
            }

            var labelsString = "";  // 如果不初始化为""则最终字符串会多出一个undefined
            var labels = memory.labels;
            for (var i = 0; i < labels.length - 1; ++i) {
                labelsString += labels[i].label + ",";
            }
            if (labels.length > 0) {
                labelsString += labels[labels.length - 1].label;
            }
            var time = TimeTool.toDateString(memory.time);
            res.send({
                ok: true,
                title: memory.title,
                author: memory.author,
                labels: labelsString,
                time: time,
                content: memory.content,
                reviewCount: memory.comments.length,
                collectCount: memory.collectors.length,
                likeCount: memory.likers.length,
                commentCount: memory.comments.length
            });
        });
    },

    get_memory_img: function(req, res) {
        var filePath = config.memory_path + "/" + req.body.memoryId + '/' + req.body.i + '.png';
        fs.exists(filePath, function(exist) {
            if (exist) res.download(filePath);
            else {
                console.error("图片不存在", req.body);
                res.end();
            }
        });
    },

    get_memory_time_for_me: function(req, res) {
        UserModel.findOne({ _id: req.body.account }, function(err, user) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            var timeForMe = null;
            for (var i = 0; i < user.collectedMemorys.length; ++i) {
                if (user.collectedMemorys[i]._id == Number(req.body.memoryId)) {
                    timeForMe = user.collectedMemorys[i].timeForMe;
                    break;
                }
            }
            res.send({
                ok: true,
                time: TimeTool.toTimeString(timeForMe)
            })
        })
    },

    get_like_count: function(req, res) {
        MemoryModel.findOne({ _id: req.body.memoryId }, function(err, memory) {
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
                    errMsg: "该忆单不存在"
                });
                return;
            }

            res.send({
                ok: true,
                count: memory.likers.length
            });
        });
    },

    get_collect_count: function(req, res) {
        MemoryModel.findOne({ _id: req.body.memoryId }, function(err, memory) {
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
                    errMsg: "该忆单不存在"
                });
                return;
            }

            res.send({
                ok: true,
                count: memory.collectors.length
            });
        });
    },

    get_comment_count: function(req, res) {
        MemoryModel.findOne({ _id: req.body.memoryId }, function(err, memory) {
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
                    errMsg: "该忆单不存在"
                });
                return;
            }

            res.send({
                ok: true,
                count: memory.comments.length
            });
        });
    },

    get_comment_list: function(req, res) {
        MemoryModel.findOne({ _id: req.body.memoryId }, function(err, memory) {
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
                    errMsg: "该忆单不存在"
                });
                return;
            }
            var commentString = "";
            var comments = memory.comments;
            for (var i = comments.length - 1; i > 0; --i) {
                commentString += comments[i]._id + ",";
            }
            if (comments.length > 0) {
                commentString += comments[0]._id;
            }
            res.send({
                ok: true,
                list: commentString
            });
        });
    },

    search_memorys: function(req, res) {
        var query = req.body.query;
        var regex = new RegExp(query, 'i'); //不区分大小写

        MemoryModel.find(
            {
                $or: [{title: regex},{content: regex}, {"labels.label": regex}]
            },
            function(err, memorys) {
                if (err) {
                    console.error(err);
                    res.send({
                        ok: false,
                        errMsg: "服务器出错"
                    });
                    return;
                }
                if (memorys.length == 0) {
                    res.send({
                        ok: false,
                        errMsg: "无相关内容"
                    });
                    return;
                }

                var listString = "";
                for (var i = 0; i < memorys.length - 1; ++i) {
                    listString += memorys[i]._id + ",";
                }
                listString += memorys[i]._id;
                res.send({
                    ok: true,
                    list: listString
                });
            });
    },

    search_memorys_via_decade: function(req, res) {
        var begin = new Date(req.body.query);
        var end = new Date(begin);
        end.setYear(1900 + end.getYear() + 10);
        console.log(begin);
        console.log(end);
        MemoryModel.find({time: { $gte: begin, $lt: end}}, function(err, memorys) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            if (memorys.length == 0) {
                res.send({
                    ok: false,
                    errMsg: "无相关内容"
                });
                return;
            }

            var listString = "";
            for (var i = 0; i < memorys.length - 1; ++i) {
                listString += memorys[i]._id + ",";
            }
            listString += memorys[i]._id;
            res.send({
                ok: true,
                list: listString
            });
        });
    },

    get_all_memory_list: function(req, res) {
        MemoryModel.find({}, function(err, memorys) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            var list = "";
            for (var i = memorys.length - 1; i > 0; --i) {
                list += memorys[i]._id + ",";
            }
            if (memorys.length > 0) {
                list += memorys[0]._id;
            }
            res.send({
                ok: true,
                list: list
            });
        })
    }
};

// 添加忆单（包含图片）
MemoryRouter.post('/add-memory', multipartMiddleware, MemoryHandler.add_memory);

// 获取忆单信息（不包含图片）
MemoryRouter.post('/get-memory', MemoryHandler.get_memory);

// 获取忆单图片
MemoryRouter.post('/get-memory-img', MemoryHandler.get_memory_img);

// 获取我收藏的忆单的timeForMe
MemoryRouter.post('/get-memory-time-for-me', MemoryHandler.get_memory_time_for_me);

// 获取忆单点赞数目
MemoryRouter.post('/get-like-count', MemoryHandler.get_like_count);

// 获取忆单被收藏数目
MemoryRouter.post('/get-collect-count', MemoryHandler.get_collect_count);

// 获取忆单评论的数目
MemoryRouter.post('/get-comment-count', MemoryHandler.get_comment_count);

// 获取忆单的评论id列表
MemoryRouter.post('/get-comment-list', MemoryHandler.get_comment_list);

// 搜索
MemoryRouter.post('/search-memorys', MemoryHandler.search_memorys);

// 搜索（年代搜索）
MemoryRouter.post('/search-memorys-via-decade', MemoryHandler.search_memorys_via_decade);

// 获取所有忆单id列表
MemoryRouter.post('/get-all-memory-list', MemoryHandler.get_all_memory_list);

module.exports = MemoryRouter;