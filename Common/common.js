//通用函数
//随机生成0到10的几个不重复随机数
var path = require('path');
var mime = require('mime');
var fs = require("fs");
exports.Common = {
    //传入每个位置的数字最大值 随机生成数字，如[3,9,9,9]
    getRandom: function (ary_digit) {
        if (ary_digit && ary_digit.length > 0) {
            var number = 0;
            for (var ary_digit_i = 0; ary_digit_i < ary_digit.length; ary_digit_i++) {
                var random_num = Math.floor(Math.random() * (parseInt(ary_digit[ary_digit_i]) + 1));//生成0-ary_digit[ary_digit_i]的整数
                number += random_num * Math.pow(10, ary_digit.length - ary_digit_i - 1);
            }
            return number;
        }
        else {
            throw Error("参数不规范");
        }
    },
    //传入需要随机生成数字个数，生成不重复的随机数0-8
    getRandomAry: function (count) {
        if (count && count > 0) {
            var random_ary = [];//申明返回的数组，里面都是数字😯
            while (random_ary.length < count) {
                var random_num = Math.floor(Math.random() * 9);
                if (!random_ary.includes(random_num)) {
                    random_ary.push(random_num);
                }
            }
            return random_ary;
        }
        else {
            throw Error("生成数字个数不规范");
        }
    },
    readStaticFile: function (res, filePathname) {
        var ext = path.parse(filePathname).ext;
        var mimeType = mime.lookup(ext);
        // 判断路径是否有后缀, 有的话则说明客户端要请求的是一个文件 
        if (ext) {
            // 根据传入的目标文件路径来读取对应文件
            fs.readFile(filePathname, (err, data) => {
                // 错误处理
                if (err) {
                    res.writeHead(404, { "Content-Type": "text/plain" });
                    res.write("404 - NOT FOUND");
                    res.end();
                } else {
                    res.writeHead(200, { "Content-Type": mimeType });
                    res.write(data);
                    res.end();
                }
            });
            // 返回 false 表示, 客户端想要的 是 静态文件
            return true;
        } else {
            // 返回 false 表示, 客户端想要的 不是 静态文件
            return false;
        }
    }
}