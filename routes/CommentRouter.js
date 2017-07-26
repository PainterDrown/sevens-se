const express = require('express');
const CommentRouter = express.Router();

// 获取数据库
const mongoose = require('mongoose');
const conn = mongoose.sevens_conn;

// 获取Models
const UserSchema = require('../models/UserSchema');
const UserModel = conn.model('users', UserSchema);
const MemorySchema = require('../models/MemorySchema');
const MemoryModel = conn.model('memorys', MemorySchema);
const CommentSchema = require('../models/CommentSchema');
const CommentModel = conn.model('comments', CommentSchema);

// 获取其他资源
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json'));  // 这里的相对路径是相对于server_app这个文件夹
const TimeTool = require("../models/TimeUtil.js");

// CommentRouter的Handler
const CommentHandler = {
    add_comment: function(req, res) {
        var comment = new CommentModel();
        comment.account = req.body.account;
        comment.content = req.body.content;
        comment.save(function(err) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }

            MemoryModel.findOneAndUpdate(
                { _id: req.body.memoryId },
                {
                    $push: {
                        comments: {
                            _id: comment._id
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
        })
    },

    get_comment: function(req, res) {
        CommentModel.findOne({ _id: req.body.commentId }, function(err, comment) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            if (!comment) {
                res.send({
                    ok: false,
                    errMsg: "该忆单不存在"
                });
                return;
            }
            var date = new Date(comment._id);
            var time = TimeTool.toTimeString(date);
            res.send({
                ok: true,
                account: comment.account,
                time: time,
                content: comment.content
            });
        });
    },

    get_comments_about_me: function(req, res) {
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
                    errMsg: "该用户不存在"
                });
                return;
            }

            // 获取用户的所以忆单id
            var cid2mid = {};
            var memorys = user.memorys;
            var commentIds = [];
            var tasks = [];
            // 获取每一条忆单的所有评论id
            for (var i = 0; i < memorys.length;  ++i) {
                var p = new Promise(function(resolve, reject) {
                    // 这里超级迷！要转为字符串才能找得到......
                    console.log(memorys[i]._id.toString());
                    MemoryModel.findOne({ _id: memorys[i]._id.toString() }, function(err, memory) {
                        if (err) {
                            console.error(err);
                            reject("服务器出错");
                            return;
                        }
                        if (!memory) {
                            resolve();
                            return;
                        }
                        // 将每个忆单中的所有评论放到数组中
                        memory.comments.forEach(function(i) {
                            commentIds.push(i._id);
                            cid2mid[i._id.toString()] = memory._id.toString();
                        });
                        resolve();
                    });
                });
                tasks.push(p);
            }
            // 等待获取完所以评论id
            Promise.all(tasks).then(function() {
                commentIds.sort();
                var tasks_ = [];
                var comments = [];
                // 取每一条评论的详情
                for (var i = commentIds.length - 1; i >= 0; --i) {
                    var p = new Promise(function(resolve, reject) {
                        CommentModel.findOne({ _id: commentIds[i].toString() }, function(err, comment) {
                            if (err) {
                                console.error(err);
                                reject("服务器出错");
                                return;
                            }
                            if (!comment) {
                                reject("该评论不存在");
                                return;
                            }
                            // 将每条评论push进去数组里面
                            comments.push({
                                memoryId: cid2mid[comment._id.toString()],
                                account: comment.account,
                                content: comment.content,
                                time: TimeTool.toTimeString(new Date(comment._id))
                            });
                            resolve();
                        });
                    });
                    tasks_.push(p);
                }
                Promise.all(tasks_).then(function() {
                    res.send({
                        ok: true,
                        jsonString: JSON.stringify(comments)
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
        });
    }
};

// 给忆单添加评论
CommentRouter.post('/add-comment', CommentHandler.add_comment);

// 获取某一条评论
CommentRouter.post('/get-comment', CommentHandler.get_comment);

// 获取跟我相关的所以评论
CommentRouter.post('/get-comments-about-me', CommentHandler.get_comments_about_me);

module.exports = CommentRouter;