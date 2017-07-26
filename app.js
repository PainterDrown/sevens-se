const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// 创建express应用
const app = express();

// 连接MongoDB
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017', {auto_reconnect: true});
mongoose.Promise = global.Promise;  // 使用ES6 Promise

// 连接数据库sevens
mongoose.sevens_conn = mongoose.createConnection('www.sysu7s.cn', 'sevens');
mongoose.sevens_conn.once('open', function() {
    console.log("Successfully connect to database sevens!");
});

// 连接数据库sevens
mongoose.dormitory_conn = mongoose.createConnection('www.sysu7s.cn', 'dormitory');
mongoose.dormitory_conn.once('open', function() {
    console.log("Successfully connect to database dormitory!");
});

const WebsiteRouter = require('./routes/WebsiteRouter');
const UserRouter  = require('./routes/UserRouter');
const MemoryRouter  = require('./routes/MemoryRouter');
const CommentRouter  = require('./routes/CommentRouter');

// use for Dormitory
const DormitoryRouter = require('./dormitory/router');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 解决跨域访问的问题
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    console.log("Client IP", req.ip);
    next();
});

// 路由
app.use('/', WebsiteRouter);
app.use('/api', UserRouter);
app.use('/api', MemoryRouter);
app.use('/api', CommentRouter);
app.use('/api/dormitory', function(req, res, next) {
    console.log(req.body);
    next();
}, DormitoryRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
