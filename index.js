//实现 随机获取方案、开方案、匹配接口
var express = require('express');
var http = require('http');
var https = require('https');
var app = express();
var fs = require("fs");
var request = require("request");
var common = require('./Common/common').Common;

fs.readFile('config.json', 'utf8', function (err, data) {
    var url = require('url');
    var path = require('path');
    var querystring = require("querystring");

    if (err) console.log(err);
    global.config = JSON.parse(data);

    var options = {
        key: fs.readFileSync(global.config.SSL.key, 'utf8'),
        cert: fs.readFileSync(global.config.SSL.cert, 'utf8')
    }

    var soduko_bll_js = require('./BLL/soduko_bll');
    var soduko_bll = new soduko_bll_js.soduko_bll();
    var redis = require('redis');
    var redis_config = global.config.redis;
    var serverhttp = http.createServer(app).listen(global.config.RESTful.http_port, function () {
        var host = serverhttp.address().address;
        var port = serverhttp.address().port;
    });

    var serverhttps = https.createServer(options, app).listen(global.config.RESTful.https_port, function () {
        var host = serverhttps.address().address;
        var port = serverhttps.address().port;
    })
    var redisClient = redis.createClient(redis_config);
    global.GSolutionCount = 0;//全局静态变量，解决方案数量
    //第一次设置方案总数
    // var solution = soduko_bll.setSolutionCount(function (aSolutionCount) {
    //     global.GSolutionCount = aSolutionCount;
    //     console.log("当前方案总数为" + aSolutionCount);
    // });

    // -----------------------------单机模式服务-----------------------------
    app.post('/clearCacheJson_nn', function (req, res) {
        getPostData(req, res, function (json) {
            if (json.wx_id) {
                //删除该用户缓存
                redisClient.del(json.wx_id, function (err, reply) {
                    res.end(JSON.stringify({ success: true }));
                });
            }
        });
    })

    app.post('/getCacheJson_nn', function (req, res) {
        getPostData(req, res, function (json) {
            if (json.wx_id) {
                //从redis获取json_nn
                redisClient.get(json.wx_id, function (err, data) {
                    res.end(data);
                });
            }
            else {
                res.end("");
            }
        });
    })

    app.post('/danji_save', function (req, res) {
        getPostData(req, res, function (json) {
            if (json.wx_id && json.json_nn) {
                //保存用户数据到redis
                redisClient.set(json.wx_id, JSON.stringify(json.json_nn), function (err, reply) {
                    res.end(JSON.stringify({ success: true }));
                });
            }
        });
    })

    app.post('/getRandomSolution', function (req, res) {
        getPostData(req, res, function (json) {
            soduko_bll.getRandomSolution(json.currentLevel, function (json_nn) {
                redisClient.del(json.wx_id, function (err, reply) { });
                res.end(JSON.stringify(json_nn));
            });
        });
    })
    
    app.get('/setSolutionCount', function (req, res) {
        try {
            var params = req.params;
            var solution = soduko_bll.setSolutionCount(function (aSolutionCount) {
                global.GSolutionCount = aSolutionCount;
                res.end("当前方案总数为" + aSolutionCount);
            });
        }
        catch (e) {
            res.end(e.message);
        }
    })

    app.post('/getRandomSolutionBak', function (req, res) {
        try {
            if (global.GSolutionCount != 0) {
                var solution = soduko_bll.getRandomSolutionBak(function (json_nn) {
                    res.end(JSON.stringify(json_nn));
                });
            }
            else {
                res.end("方案总数为0，请设置");
            }
        }
        catch (e) {
            res.end(e.message);
        }
    })

    app.post('/getOpenid', function (req, res) {
        getPostData(req, res, function (json) {
            //调用微信API
            request.get({
                url: "https://api.weixin.qq.com/sns/jscode2session?appid=wxeec4a662adc5e3c7&secret=d2cce0a6bffeaed48fdf04d86c18072c&js_code=" + json.code + "&grant_type=authorization_code"
            }, function (err, response, body) {
                res.end(body);
            });
        });
    })

    //图片服务
    app.get('/file/images', function (req, res) {
        try {
            var params = req.params;
            var arg = url.parse(req.url).query;
            var params = querystring.parse(arg);
            if (params.file) {
                var filePath = path.join(__dirname, "/resource/images", params.file);
                common.readStaticFile(res, filePath);
            }
            else {
                res.end("404");
            }
        }
        catch (e) {
            res.end(e.message);
        }
    })

    // -----------------------------开房间模式服务-----------------------------

    function getPostData(req, res, callback) {
        var data = "";
        req.on('data', function (chunk) {
            data += chunk;
        });
        req.on('end', function () {
            var json = JSON.parse(data);
            callback(json);
        })
    }
});
