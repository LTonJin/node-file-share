const fs = require('fs');
module.exports = function butelLogger(moduleName, printLevel, writeLevel) {
    //writeLevel总级别
    var ButelLogger_writeLevel = 4;
    //printLevel总级别
    var ButelLogger_printLevel = 4;


    //utils
    function isTrue(v) {
        return v === true
    }

    function isFalse(v) {
        return v === false
    }

    function isUndef(v) {
        return v === undefined || v === null
    }


    var NativeLog = null;


    /**
     *
     * @param {*} moduleName 模块名
     * @param {*} printLevel 打印等级 默认为 4
     * @param {*} writeLevel 写文件等级 默认为 4
     */
    function Logger(moduleName, printLevel, writeLevel) {
        this.moduleName = isUndef(moduleName) ? 'butelLogger' : moduleName;
        this.printLevel = isUndef(printLevel) ? 4 : printLevel;
        this.writeLevel = isUndef(writeLevel) ? 4 : writeLevel;
    }


    /**
     * @description 错误
     */
    Logger.prototype.error = function () {
        var args = Array.prototype.slice.call(arguments, 0);


        args.unshift('【' + this.moduleName + '】');
        args.unshift('【' + new Date().toLocaleString() + '】');

        var message = '';
        for (let msg of args) {
            message += ' <---> ' + (typeof msg === 'object' ? JSON.stringify(msg) : msg);
        }

        if (ButelLogger_printLevel) {
            console.error(message);
            fs.appendFileSync(Config.writeLogPath, message+"\n");
        }


    };

    /**
     * @description 警告
     */
    Logger.prototype.warn = function () {
        var args = Array.prototype.slice.call(arguments, 0);

        args.unshift('【' + this.moduleName + '】');
        args.unshift('【' + new Date().toLocaleString() + '】');

        var message = '';
        for (let msg of args) {
            message += ' <---> ' + (typeof msg === 'object' ? JSON.stringify(msg) : msg);
        }

        if (ButelLogger_printLevel > 1 && this.printLevel > 1) {
            console.warn(message);
        }

    }

    /**
     * @description 信息
     */
    Logger.prototype.info = function () {
        var args = Array.prototype.slice.call(arguments, 0);

        args.unshift('【' + this.moduleName + '】');
        args.unshift('【' + new Date().toLocaleString() + '】');

        var message = '';
        for (let msg of args) {
            message += (typeof msg === 'object' ? JSON.stringify(msg) : msg);
        }

        if (ButelLogger_printLevel > 2 && this.printLevel > 2) {
            console.info(message);
        }
    }

    /**
     * @description 一般
     */
    Logger.prototype.log = function () {
        var args = Array.prototype.slice.call(arguments, 0);
        args.unshift('【' + this.moduleName + '】');
        args.unshift('【' + new Date().toLocaleString() + '】');
        var message = '';
        for (let msg of args) {
            message += ' <---> ' + (typeof msg === 'object' ? JSON.stringify(msg) : msg);
        }

        if (ButelLogger_printLevel > 3 && this.printLevel > 3) {
            console.log(message);
        }


    }
    var instance = new Logger(moduleName, printLevel, writeLevel);
    return instance;
}

