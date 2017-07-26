var mongoose = require('mongoose');
var TimeUtil = require('./TimeUtil');

var MemorySchema = mongoose.Schema({
    _id: { type: Number, default: TimeUtil.now },  // 创建忆单的时间（时间戳）

    title: String,
    author: String,
    time: Date,  // 关于回忆的时间
    labels: [{
        _id: false,
        label: String
    }],
    description: String,
    content: String,
    /**
     * 0 - 私密
     * 1 - 只允许作者补充
     * 2 - 只允许作者的好友补充
     * 3 - 公开（允许所有人补充）
     */
    authority: { type: Number, default: 1 },

    collectors: [{
        _id: String
    }],
    comments: [{
        _id: Number
    }],
    likers: [{
        _id: String
    }]
});

module.exports = MemorySchema;
