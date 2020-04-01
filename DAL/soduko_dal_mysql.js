exports.soduko_dal = function () {
    var mysql = require('mysql');
    var connection = mysql.createConnection(global.config.mysql);

    //随机获取解决方案
    this.getRandomSolution = function (s_index, callback) {
        var selectSQL = "select json from solution where s_index=?";
        var selectParams = [s_index];
        var solution_json = "";
        execSQL(selectSQL, selectParams, callback);
    }
    //获取解决方案数量
    this.getSolutionCount = function (callback) {
        var selectSQL = "select max(s_index) count from solution";
        var selectParams = [];
        var solution_json = "";
        execSQL(selectSQL, selectParams, callback);
    }
    function execSQL(aSQL, aParams, callback) {
        connection.query(aSQL, aParams, (err, rows) => {
            if (err) {
                console.log('[SQL ERROR] - ', err.message);
            } else {
                callback(rows);
            }
        })
    }
}