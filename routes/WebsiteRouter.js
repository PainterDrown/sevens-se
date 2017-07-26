var express = require('express');
var WebsiteRouter = express.Router();
var fs = require('fs');
var moment = require('moment');

// 访问主页
WebsiteRouter.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

// 接收建议
WebsiteRouter.post('/advise', function(req, res) {
    var data = req.body;
    var advice = "";
    advice += "Time: " + moment().format('YYYY-MM-DD HH:mm:ss') + "\n";
    advice += "Advice: " + data.content + "\n";
    advice += "\n";
    console.log(advice);
    fs.appendFile('../data/advices.log', advice, function (err) {
        if (err) throw err;
    });
    res.end();
});

module.exports = WebsiteRouter;