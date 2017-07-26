const express = require('express');
const FutureRouter = express.Router();

// 获取数据库
const mongoose = require('mongoose');
const conn = mongoose.sevens_conn;

// 获取Models
const UserSchema = require('../models/UserSchema');
const UserModel = conn.model('users', UserSchema);
const FutureSchema = require('../models/FutureSchema');
const FutureModel = conn.model('futures', FutureSchema);

// 获取其他资源
const TimeUtil = require("../models/TimeUtil.js");

const FutureHandler = {
    add_future: function(req, res) {
        var future = new FutureModel();
        future.from = req.body.from;
        future.from = req.body.to;
        future.content = req.body.content;
        future.duetime = new Date(req.body.duetime);
        future.save(function(err) {
            if (err) {
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            var p1 = new Promise(function(resolve, reject) {
                UserModel.findOneAndUpdate(
                    {_id:from},
                    {$push: {
                        futures: {
                            _id: future._id
                        }
                    }},
                    function(err) {
                        if (err) reject("服务器出错");
                        else resolve();
                    });
            });
            var p2 = new Promise(function(resolve, reject) {
                UserModel.findOneAndUpdate(
                    {_id:to},
                    {$push: {
                        futuresForMe: {
                            _id: future._id
                        }
                    }},
                    function(err) {
                        if (err) reject("服务器出错");
                        else resolve();
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
            })
        });
    },

    get_future: function(req, res) {
        FutureModel.findOne({_id: futureId}, function(err, future) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            if (!future) {
                res.send({
                    ok: false,
                    errMsg: "该时光囊不存在"
                });
                return;
            }
            res.send({
                ok: true,
                from: future.from,
                to: future.to,
                content: future.content,
                duetime: TimeUtil.toTimeString(future.duetime)
            });
        });
    },

    if_time_is_up: function(req, res) {
        FutureModel.findOne({_id:req.body.futureId}, function(err, future) {
            if (err) {
                console.error(err);
                res.send({
                    ok: false,
                    errMsg: "服务器出错"
                });
                return;
            }
            if (!future) {
                res.send({
                    ok: false,
                    errMsg: "该时光囊不存在"
                });
                return;
            }
            if (future.duetime < TimeUtil.now()) {
                res.send({
                    ok: false,
                    errMsg: "时间还没到"
                });
            }
            else {
                res.send({
                    ok: true
                });
            }
        });
    }
};

FutureRouter.post('/add-future', FutureHandler.add_future);

FutureRouter.post('/get-future', FutureHandler.get_future);

FutureRouter.post('/if-time-is-up', FutureHandler.if_time_is_up);

module.exports = FutureRouter;