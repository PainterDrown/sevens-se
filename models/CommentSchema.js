var mongoose = require('mongoose');
var TimeUtil = require('./TimeUtil');

var CommentSchema = mongoose.Schema({
    _id: { type: Number, default: TimeUtil.now },

    account: String,
    content: String
});

module.exports = CommentSchema;