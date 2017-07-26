var mongoose = require('mongoose');
var TimeUtil = require('./TimeUtil');

var FutureSchema = mongoose.Schema({
    _id: { type: Number, default: TimeUtil.now },

    from: String,
    to: String,
    content: String,
    duetime: Date
});

module.exports = CommentSchema;