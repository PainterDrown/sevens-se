var mongoose = require('mongoose');
var TimeUtil = require('./TimeUtil');

var UserSchema = mongoose.Schema({
    // 账户信息
    _id: String,
    password: String,
    createTime: { type: Date, default: TimeUtil.now },

    // 个人信息
    sex: { type: Number, default: 0 },
    birthday: { type: Date, default: TimeUtil.zero }, // TimeUtil.birthdayDefault

    // 用户信息
    username: { type: String, default: "未填写" },
    introduction: { type: String, default: "未填写" },
    followings: [{
        _id: String
    }],
    followeds: [{
        _id: String
    }],
    collectedMemorys: [{
        _id: Number,
        timeForMe: Date
    }],
    memorys: [{
        _id: Number
    }],
    futures: [{
        _id: Number
    }],
    futuresForMe: [{
        _id: Number
    }]
});

module.exports = UserSchema;