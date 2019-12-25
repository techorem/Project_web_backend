"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var leveldb_1 = require("./leveldb");
var level_ws_1 = require("level-ws");
var Metric = /** @class */ (function () {
    function Metric(ts, v) {
        this.timestamp = ts;
        this.value = v;
    }
    Metric.fromDb = function (key, value) {
        var _a = key.split(":"), type = _a[0], user = _a[1], id = _a[2], timestamp = _a[3];
        return { user: user, id: id, timestamp: timestamp, value: value };
    };
    return Metric;
}());
exports.Metric = Metric;
var MetricsHandler = /** @class */ (function () {
    function MetricsHandler(dbPath) {
        this.db = leveldb_1.LevelDB.open(dbPath);
    }
    MetricsHandler.prototype.getOne = function (key, callback) {
        if (key != null) {
            this.db.get(key, function (err, res) {
                if (err)
                    callback(err, null);
                else
                    callback(null, res);
            });
        }
        else
            callback(new Error("there is no key"), null);
    };
    MetricsHandler.prototype.get = function (user, callback) {
        var Data = Array();
        var result = this.db.createReadStream()
            .on('data', function (data) {
            var MetricToGet;
            MetricToGet = Metric.fromDb(data.key, data.value);
            if (MetricToGet.user === user)
                Data.push(MetricToGet);
        })
            .on('error', function (err) {
            callback(err, []);
        })
            .on('close', function () {
            callback(null, Data);
        })
            .on('end', function () {
            console.log('Stream ended');
        });
    };
    MetricsHandler.prototype.save = function (key, metrics, callback) {
        var stream = level_ws_1.default(this.db);
        stream.on('error', callback);
        stream.on('close', callback);
        metrics.forEach(function (m) {
            stream.write({ key: "metric:" + key + m.timestamp, value: m.value });
        });
        stream.end();
    };
    MetricsHandler.prototype.delete = function (key, callback) {
        this.db.del(key, function (err, res) {
            if (err)
                callback(err, null);
            else
                callback(null, res);
        });
    };
    return MetricsHandler;
}());
exports.MetricsHandler = MetricsHandler;
