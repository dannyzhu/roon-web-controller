var bunyan = require('bunyan');
var stream = require('stream');
var path = require('path');

var customStream = new stream.Writable({
    write: function(chunk, encoding, next) {
        var logEntry = JSON.parse(chunk.toString());
        var level = bunyan.nameFromLevel[logEntry.level].toUpperCase().padEnd(5);
        var time = new Date(logEntry.time).toISOString().split('T')[1].replace('Z', '');
        var srcInfo = logEntry.src || 'unknown location';
        // 修改这一行来改变输出格式，level 固定为 5 个字符宽度
        console.log(`${time} ${level} ${srcInfo}: ${logEntry.msg}`);
        next();
    }
});

var baseLogger = bunyan.createLogger({
    name: 'roon-web-player',
    streams: [
        {
            level: 'trace',
            stream: customStream
        }
    ],
    serializers: bunyan.stdSerializers
});

function createLogFunction(level) {
    return function() {
        var error = new Error();
        var stack = error.stack.split('\n');
        var callerInfo = stack[2].match(/\((.*):\d+:\d+\)/);
        var srcInfo = 'unknown location';
        if (callerInfo && callerInfo[1]) {
            srcInfo = path.basename(callerInfo[1]) + ':' + stack[2].split(':').slice(-2)[0];
        }
        var args = Array.from(arguments);
        args.unshift({ src: srcInfo });
        return baseLogger[level].apply(baseLogger, args);
    };
}

var log = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].reduce((acc, level) => {
    acc[level] = createLogFunction(level);
    return acc;
}, {});

module.exports = log;
