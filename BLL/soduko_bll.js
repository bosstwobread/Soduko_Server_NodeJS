var common = require('../Common/common').Common;
var request = require("request");
exports.soduko_bll = function () {
    var soduko_dal_js = require('../DAL/soduko_dal_mysql');
    var soduko_dal = new soduko_dal_js.soduko_dal();
    this.getRandomSolution = function (a_currentLevel, callback) {
        var api_url = "";
        switch (a_currentLevel) {
            case "easy": api_url = global.config.thirdAPI.easy; break;
            case "medium": api_url = global.config.thirdAPI.medium; break;
            case "hard": api_url = global.config.thirdAPI.hard; break;
            case "expert": api_url = global.config.thirdAPI.expert; break;
            default: api_url = global.config.thirdAPI.easy; break;
        }
        request.get({
            url: api_url
        }, function (err, response, body) {
            var _json_body = JSON.parse(body);
            var _solution_str = _json_body.desc[1];
            var _exercise_str = _json_body.desc[0];
            var json_nn = [];
            if (_solution_str && _solution_str.length == 81 && _exercise_str && _exercise_str.length == 81) {
                var json_row = [];
                for (var col_num = 0; col_num < 9; col_num++) {
                    for (var row_num = 0; row_num < 9; row_num++) {
                        var _index = col_num * 9 + row_num;
                        if (_exercise_str[_index] == 0) {
                            json_row.push({ number: -1, answer: _solution_str[_index] });
                        }
                        else {
                            json_row.push({ number: _solution_str[_index], iInit: true });
                        }
                        if (row_num == 8) {
                            json_nn.push(JSON.parse(JSON.stringify(json_row)));
                            json_row = [];
                        }
                    }
                }
            }
            callback(json_nn);
        });
    }
    this.getRandomSolutionBak = function (callback) {
        //生成随机数
        var s_index = 0;
        while (s_index == 0) {
            //将global.GSolutionCount数字拆分成数组
            var number_str = global.GSolutionCount.toString();
            var number_ary = [];
            for (var number_str_i = 0; number_str_i < number_str.length; number_str_i++) {
                number_ary.push(number_str[number_str_i]);
            }
            s_index = common.getRandom(number_ary);
        }
        var solution = soduko_dal.getRandomSolution(s_index, function (rows) {
            var json_nn = [];
            if (rows && rows.length == 1) {
                var json_ary = rows[0].json.split(',');
                if (json_ary && json_ary.length == 81) {
                    var json_row = [];
                    for (var col_num = 0; col_num < 9; col_num++) {
                        for (var row_num = 0; row_num < 9; row_num++) {
                            json_row.push({ number: json_ary[col_num * 9 + row_num] });
                            if (row_num == 8) {
                                json_nn.push(JSON.parse(JSON.stringify(json_row)));
                                json_row = [];
                            }
                        }
                    }
                    //随机挖空部分空位
                    getRandomExercise(json_nn, callback);
                }
                else {
                    throw new Error('数据格式错误：' + rows[0].json + ";长度仅有：" + json_ary.length);
                }
            }
            else {
                throw new Error('数据不存在，序号' + s_index);
            }
        });
        return solution;
    }
    this.setSolutionCount = function (callback) {
        soduko_dal.getSolutionCount(function (rows) {
            callback(rows[0].count);
        });
    }
    function getRandomExercise(json_nn, callback) {
        //随机确定3-6个初始化位保留，其他全部抽空
        //设二维数组9个长度，填入3-6的数字，加起来在35-40范围，穷举多少种，然后每行排列组合挖空剩余的，对每一种情况进行验证
        var row_ary = [];
        var sum = 0;
        //随机抽取的题目编号，总数为8451个，随机抽取一个即可
        var ramdom_exercise_index = 0;
        while (ramdom_exercise_index == 0) {
            ramdom_exercise_index = common.getRandom([8, 4, 5, 1]);
        }
        var exercise_index = 0;
        var i_find = false;
        recordNum(0);
        // console.log(exercise_index);
        //cur_deep:递归深度，第九层（9）时进行求和计算
        function recordNum(cur_deep) {
            if (i_find == true) return;
            cur_deep++;//当前深度+1
            for (var num = 3; num < 7; num++) {//每行暂定需要至少3-6数字
                if (i_find == true) return;
                row_ary.splice(cur_deep - 1, 1, num);//删除该深度的数字，并替换，该深度不存在数字也没事，不会报错，就这样吧
                if (cur_deep == 9) {
                    if (verify_sum_row_ary()) {
                        exercise_index++;
                        if (ramdom_exercise_index == exercise_index) {
                            //对每个空格进行填充，并验证，如果通过则存入数据库
                            var _exercise_json_nn = JSON.parse(JSON.stringify(json_nn));//题目json
                            var _solution_json_nn = JSON.parse(JSON.stringify(json_nn));//方案json
                            //根据初始化的数据对json_nn进行处理，每行的初始化数字情况随机抽取一种即可，否则数据量太大
                            for (var row_index = 0; row_index < _exercise_json_nn.length; row_index++) {
                                var random_init_ary = common.getRandomAry(row_ary[row_index]);//拿到每行的随机初始化位
                                //标识初始化数字
                                random_init_ary.forEach(function (num) {
                                    _exercise_json_nn[row_index][num].iInit = true;
                                })
                                //标识非初始化数字
                                for (var col_index = 0; col_index < _exercise_json_nn.length; col_index++) {
                                    if (_exercise_json_nn[row_index][col_index].iInit == undefined) {
                                        var _cur_number = _exercise_json_nn[row_index][col_index].number;
                                        _exercise_json_nn[row_index][col_index].number = -1;
                                        _exercise_json_nn[row_index][col_index].answer = _cur_number;
                                        console.log(1);
                                    }
                                }
                                //这里其实要验证是否唯一解，后面再做，先插入数据库，界面出来再说
                            }
                            i_find = true;
                            callback(_exercise_json_nn);
                            break;
                        }
                    }
                }
                if (cur_deep < 9) {
                    recordNum(cur_deep);
                }
            }
        }
        function verify_sum_row_ary() {
            var sum = 0;
            for (var row_ary_index = 0; row_ary_index < 9; row_ary_index++) {
                sum += row_ary[row_ary_index];
            }
            if (sum == 35) {//cur_deep
                return true;
            }
            return false;
        }
    }
}