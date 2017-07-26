const mongoose = require('mongoose');
const TimeUtil = require('../models/TimeUtil');

const DormitorySchema = mongoose.Schema({
    did: { type: String, index: true },

    password: String,
    size: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    balance: { type: Number, default: 0.00 },
    journals: [{
        jid: Number
    }],
});

const JournalSchema = mongoose.Schema({
    jid: { type: Number, default: TimeUtil.now, index: true },

    content: String
});

const MemberSchema = mongoose.Schema({
    did: { type: String, index: true },
    mno: { type: Number, index: true },

    name: String,
    birth: Number,
    location: String,
    count: { type: Number, default: 1 }
});

const CheckbookItemSchema = mongoose.Schema({
    did: { type: String, index: true },
    cno: { type: String, index: true },

    name: String,
    time: Number,
    cost: Number,
    state: Boolean,
    note: String
});

const DutySchema = mongoose.Schema({
    did: { type: String, index: true },
    dno: { type: Number, index: true },

    name: String,
    time: Number,
    note: String
});

const schemas = {
    DormitorySchema: DormitorySchema,
    JournalSchema: JournalSchema,
    MemberSchema: MemberSchema,
    CheckbookItemSchema: CheckbookItemSchema,
    DutySchema: DutySchema
};

module.exports = schemas;
