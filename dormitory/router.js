const express = require('express');
const router = express.Router();

// 获取数据库
const mongoose = require('mongoose');
const conn = mongoose.dormitory_conn;

// 获取Models
const schemas = require('./schemas');
const Dormitory = conn.model('dormitorys', schemas.DormitorySchema);
const Journal = conn.model('journals', schemas.JournalSchema);
const Member = conn.model('members', schemas.MemberSchema);
const CheckbookItem = conn.model('checkbook_items', schemas.CheckbookItemSchema);
const Duty = conn.model('duties', schemas.DutySchema);

// 处理复杂的文件上传、下载
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const path = require('path');

// 获取其他资源
mongoose.Promise = global.Promise;  // 使用ES6 Promise
const TimeUtil = require('../models/TimeUtil.js');
var fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json'));  // 这里的相对路径是相对于server_app这个文件夹

const Handler = {
    login: async function(req, res) {
        try {
            let d = await Dormitory.findOne({ did: req.body.account });
            if (!d) throw("账户不存在");
            if (d.password != req.body.password) throw("密码错误");
            res.send({
                ok: true
            });
        } catch(err) {
            console.error(err);
            res.send({
                ok: false,
                errMsg: err
            });
        }
    },

    register: async function(req, res) {
        try {
            // 判断是否已被注册
            let d = await Dormitory.findOne({ did: req.body.did });
            if (!!d) throw("该账户已被注册");

            // 创建新宿舍账户
            var newd = new Dormitory();
            newd.did = req.body.account;
            newd.password = req.body.password;
            await newd.save();

            // 创建文件夹以保存成员的照片
            await fs.mkdir(config.dormitory_path + "/members/" + newd.did + "/", (err) => { if (!!err) throw err; });

            // 响应
            res.send({
                ok: true
            });
        } catch(err) {
            console.error(err);
            res.send({
                ok: false,
                errMsg: err
            });
        }
    },

    add_journal: async function(req, res) {
        try {
            // 创建Journal
            var newJournal = new Journal();
            var info = JSON.parse(req.body.null);
            newJournal.content = info.content;
            await newJournal.save();

            // 保存到宿舍账户中
            await Dormitory.findOneAndUpdate({ did: info.did }, { $push: {
                journals: {
                    jid: newJournal.jid
                }
            }});

            // 保存图片
            var dir = config.dormitory_path + "/journals/";
            var filename = newJournal.jid + ".png";
            await fs.rename(req.files.null.path, dir + filename, (err) => { if (!!err) throw err; });

            // 响应
            res.send({
                ok: true
            });
        } catch(err) {
            console.error(err);
            res.send({
                ok: false,
                errMsg: err
            });
        }
    },

    delete_journal: async function(req, res) {
        try {
            await Journal.remove({ jid: req.body.jid });

            // 更新宿舍账户中journals
            await Dormitory.findOneAndUpdate({ did: req.body.did }, { $pull: {
                journals: { jid: req.body.jid }
            }});

            // 响应
            res.send({
                ok: true
            });
        } catch(err) {
            console.error(err);
            res.send({
                ok: false,
                errMsg: err
            });
        }
    },

    edit_journal: async function(req, res) {
        try {
            // 更新内容
            var info = JSON.parse(req.body.null);
            await Journal.findOneAndUpdate({ jid: info.jid }, { $set: {
                content: info.content
            }});

            // 更新图片
            var dir = config.dormitory_path + "/journals/";
            var filename = info.jid + ".png";
            await fs.rename(req.files.null.path, dir + filename, (err) => { if (!!err) throw err; });

            // 响应
            res.send({
                ok: true
            });
        } catch(err) {
            console.error(err);
            res.send({
                ok: false,
                errMsg: err
            });
        }
    },

    add_member: async function(req, res) {
        try {
            // 创建新成员
            var info = JSON.parse(req.body.null);
            var newm = new Member();
            let d = await Dormitory.findOne({ did: info.did });
            if(!d) throw("该宿舍账户不存在");
            newm.did = info.did;
            newm.mno = d.size;
            newm.name = info.name;
            newm.birth = info.birth;
            newm.location = info.location;
            await newm.save();

            // 更新宿舍账户的size
            await Dormitory.findOneAndUpdate({ did: info.did }, { $inc: { size: 1 }});

            // 保存新成员照片
            var dir = config.dormitory_path + "/members/" + info.did + "/";
            var filename = newm.mno + ".png";
            await fs.rename(req.files.null.path, dir + filename, (err) => { if(!!err) throw err; });

            // 响应
            res.send({
                ok: true
            });
        } catch(err) {
            console.error(err);
            res.send({
                ok: false,
                errMsg: err
            });
        }
    },

    get_member_names: async function(req, res) {
        try {
            let d = await Dormitory.findOne({ did: req.body.did });
            var names = [];
            let members = await Member.find({ did: req.body.did });
            for (var i = 0; i < members.length; ++i) {
                names.push(members[i].name);
            }
            res.send({
                ok: true,
                names: names
            });
        } catch(err) {
            console.error(err);
            res.send({
                ok: false,
                errMsg: err
            });
        }
    },

    get_members: async function(req, res) {
        try {
            let members = await Member.find({ did: req.body.did });
            res.send({
                ok: true,
                members: members
            });
        } catch(err) {
            console.error(err);
            res.send({
                ok: false,
                errMsg: err
            });
        }
    },

    get_journals: async function(req, res) {
        try {
            let d = await Dormitory.findOne({ did: req.body.did });
            if (!d) throw("该宿舍账户不存在");
            var jids = d.journals;
            var journals = [];
            for (let i = 0; i < jids.length; ++i) {
                let journal = await Journal.findOne({ jid: jids[i].jid });
                journals.push({
                    jid: jids[i].jid,
                    content: journal.content
                });
            }
            res.send({
                ok: true,
                journals: journals
            });
        } catch(err) {
            console.error(err);
            res.send({
                ok: false,
                errMsg: err
            });
        }
    },

    get_journal_image: function(req, res) {
        var jid = req.params.jid;
        var filePath = config.dormitory_path + "/journals/" + jid + ".png";
        res.sendFile(path.join(__dirname, "../", filePath));
    },

    get_member_image: function(req, res) {
        var filePath = config.dormitory_path + "/members/" + req.params.did + "/" + req.params.mno + ".png";
        res.sendFile(path.join(__dirname, "../", filePath));
    },

    add_checkbook_item: async function(req, res) {
        try {
            let d = await Dormitory.findOne({ did: req.body.did });
            if (!d) throw("该宿舍账户不存在");

            // 创建新的账本项目
            var newc = new CheckbookItem();
            newc.did = req.body.did;
            newc.cno = d.count;
            newc.name = req.body.name;
            newc.time = req.body.time;
            newc.cost = req.body.cost;
            newc.state = req.body.state;
            newc.note = req.body.note;
            await newc.save();

            // 更新宿舍账户中的count
            await Dormitory.findOneAndUpdate({ did: req.body.did }, { $inc: {
                count: 1,
                balance: req.body.cost
            }});

            // 响应
            res.send({
                ok: true,
                cno: d.count
            });
        } catch(err) {
            console.error(err);
            res.send({
                ok: false,
                errMsg: err
            });
        }
    },

    edit_checkbook_item: async function(req, res) {
        try {
            await CheckbookItem.findOneAndUpdate({ did: req.body.did, cno: req.body.cno }, { $set: {
                name: req.body.name,
                time: req.body.time,
                cost: req.body.cost,
                state: req.body.state,
                note: req.body.note
            }});

            // 响应
            res.send({
                ok: true
            });
        } catch(err) {
            console.error(err);
            res.send({
                ok: false,
                errMsg: err
            });
        }
    },

    get_checkbook: async function(req, res) {
        try {
            var checkbook = {};
            let d = await Dormitory.findOne({ did: req.body.did });
            checkbook.balance = d.balance;
            checkbook.items = await CheckbookItem.find({ did: req.body.did });
            console.log(checkbook);
            res.send({
                ok: true,
                checkbook: checkbook
            });
        } catch(err) {
            console.error(err);
            res.send({
                ok: false,
                errMsg: err
            });
        }
    },

    add_duty: async function(req, res) {
        try {
            let member = await Member.findOne({ did: req.body.did, mno: req.body.mno });

            // 创建新的Duty
            var newdt = new Duty();
            newdt.did = req.body.did;
            newdt.dno = member.count - 1;
            newdt.name = req.body.name;
            newdt.time = req.body.time;
            newdt.note = req.body.note;
            await newdt.save();

            // 更新Member的count
            await Member.findOneAndUpdate({ did: req.body.did, cno: req.body.cno }, { $inc: { count: 1 }});

            // 响应
            res.send({
                ok: true
            });
        } catch(err) {
            console.error(err);
            res.send({
                ok: false,
                errMsg: err
            });
        }
    },

    get_duties: async function(req, res) {
        try {
            let duties = await Duty.find({ did: req.body.did });
            var counts = [];
            let members = await Member.find({ did: req.body.did });
            for (var i = 0; i < members.length; ++i) {
                counts.push({
                    mno: members[i].mno,
                    name: members[i].name,
                    count: members[i].count
                });
            }
            console.log(duties);
            console.log(counts);
            res.send({
                ok: true,
                duties: duties,
                counts: counts
            });
        } catch(err) {
            console.error(err);
            res.send({
                ok: false,
                errMsg: err
            });
        }
    }
};

router.post('/login', Handler.login);

router.post('/register', Handler.register);

router.post('/add-journal', multipartMiddleware, Handler.add_journal);

router.post('/delete-journal', multipartMiddleware, Handler.delete_journal);

router.post('/edit-journal', multipartMiddleware, Handler.edit_journal);

router.post('/get-member-names', Handler.get_member_names);

router.post('/add-member', multipartMiddleware, Handler.add_member);

router.post('/get-members', Handler.get_members);

router.post('/get-journals', Handler.get_journals);

router.get('/get-journal-image/:jid', Handler.get_journal_image);

router.get('/get-member-image/:did/:mno', Handler.get_member_image);

router.post('/add-checkbook-item', Handler.add_checkbook_item);

router.post('/edit-checkbook-item', Handler.edit_checkbook_item);

router.post('/get-checkbook', Handler.get_checkbook);

router.post('/add-duty', Handler.add_duty);

router.post('/get-duties', Handler.get_duties);

module.exports = router;