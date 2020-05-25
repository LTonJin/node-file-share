const mysql = require('mysql');
const BLogger = require('./ButelLogger');
module.exports = function DBConnect() {
    const _logger = new BLogger("DBConnect", 4);
    const Pool = mysql.createPool(Config.dbConfig);
    // const db = mysql.createConnection(Config.dbConfig);
    this.currentState = Config.CONNECT_STATE.UNINIT;

    /**
     * 构造返回参数模式
     * @param code
     * @param des
     * @return {{code: *, des: string}}
     * @private
     */
    function _makeErrMessage(code, des) {
        let desString = '';
        try {
            desString = JSON.stringify(des);
        } catch (e) {
            _logger.error('错误描述解析出错', e);
        }
        return {'code': code, 'des': desString};
    }

    /**
     * 检测文章表是否存在
     * @private
     */
    function _checkDocTable() {
        return new Promise((resolve, reject) => {
            _logger.info("开始检测文章表");
            /**
             * id :序号
             * doc_id ：文章id
             * doc_name：文章名
             * nube;归属人账号
             * state：当前状态
             * @type {string}
             */
            Pool.getConnection(function (err, conn) {
                if (err) {
                    _logger.error("创建文章表时连接池异常", err);
                    reject({code: '-3', des: '创建文章表时连接池异常', data: null});
                    if(conn){
                        conn.release();
                    }
                    return
                } else {
                    let checkDocTableSqlString = "CREATE TABLE IF NOT EXISTS doc_sum_info (\
            id VarChar(100) NOT NULL,\
            senderName VarChar(100) NOT NULL,\
            senderNube VarChar(200) ,\
            filename VarChar(1000) NOT NULL,\
            status VarChar(10) NOT NULL,\
            taskId VarChar(100) NOT NULL,\
            tgtLoc VarChar(100) NOT NULL,\
            PRIMARY KEY (`id`)\
           ) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;";
                    conn.query(checkDocTableSqlString, (err, results, fields) => {
                        if (err) {
                            _logger.error("创建文章表格异常", err);
                            reject({code: '-1', des: '创建文章表格异常', data: null});
                            if(conn){
                                conn.release();
                            }
                            return
                        }
                        if (results) {
                            _logger.info("创建文章表格成功", results);
                            resolve({code: '0', des: '创建文章表格成功', data: null});
                            if(conn){
                                conn.release();
                            }
                            return;
                        }
                        if (fields) {
                            _logger.error("创建文章表格失败", fields);
                            reject({code: '-2', des: '创建文章表格失败', data: null});
                            if(conn){
                                conn.release();
                            }
                            return;
                        }
                    });
                }
            });
        });
    }

    /**
     * 检测图片表是否存在
     * @private
     */
    function _checkPicTable() {
        return new Promise((resolve, reject) => {
            _logger.info("开始检测图片表");
            /**
             * id :序号
             * doc_id ：文章id
             * doc_name：文章名
             * nube;归属人账号
             * state：当前状态
             * @type {string}
             */
            Pool.getConnection(function (err, conn) {
                if (err) {
                    _logger.error("创建图片表时连接池异常", err);
                    reject({code: '-3', des: '创建图片表时连接池异常', data: null});
                    if(conn){
                        conn.release();
                    }
                    return
                } else {
                    let checkPicTableSqlString = "CREATE TABLE IF NOT EXISTS pic_info (\
            id VarChar(100) NOT NULL,\
            urls LongText NOT NULL,\
            PRIMARY KEY (`id`),\
            CONSTRAINT id FOREIGN KEY(id) REFERENCES doc_sum_info(id)\
           ) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;";
                    conn.query(checkPicTableSqlString, (err, results, fields) => {
                        if (err) {
                            _logger.error("创建图片表格异常", err);
                            reject({code: '-1', des: '创建图片表格异常', data: null});
                            if(conn){
                                conn.release();
                            }
                            return;
                        }
                        if (results) {
                            _logger.info("创建图片表格成功", results);
                            resolve({code: '0', des: '创建图片表格成功', data: null});
                            if(conn){
                                conn.release();
                            }
                            return;
                        }
                        if (fields) {
                            _logger.error("创建图片表格失败", fields);
                            reject({code: '-2', des: '创建图片表格失败', data: null});
                            if(conn){
                                conn.release();
                            }
                            return;
                        }

                    });
                }
            });
        })
    }

    DBConnect.prototype.init = function () {
        return new Promise(async (resolve, reject) => {
            _logger.info('开始初始化数据库');
            if (this.currentState !== Config.CONNECT_STATE.UNINIT) {
                _logger.error("状态错误，当前状态为：" + this.currentState);
                reject(_makeErrMessage(Config.DB_ERROR.STATEERROR, "状态错误，当前状态为：" + this.currentState));
            }
            const result1 = await _checkDocTable();
            const result2 = await _checkPicTable();
            if (result1.code === '0' && result2.code === '0') {
                this.currentState = Config.CONNECT_STATE.OK;
                resolve(_makeErrMessage(Config.DB_ERROR.OK, "数据库连接成功"));
            }
            if (result1.code !== '0') {
                this.currentState = Config.CONNECT_STATE.OK;
                reject(_makeErrMessage(Config.DB_ERROR.CONNECTERROR, result1));
            }
            if (result2.code !== '0') {
                this.currentState = Config.CONNECT_STATE.OK;
                reject(_makeErrMessage(Config.DB_ERROR.CONNECTERROR, result2));
            }

        });
    };

    /**
     * 插入和更新文档
     * @param data
     * @returns {Promise<any>}
     */
    DBConnect.prototype.insertDoc = function (data) {
        return new Promise((resolve, reject) => {
            Pool.getConnection(function (err, conn) {
                if (err) {
                    _logger.error("插入文档异常连接池异常", err);
                    reject({code: '-3', des: '插入文档异常连接池异常', data: null});
                    if(conn){
                        conn.release();
                    }
                    return
                } else {
                    let str = `INSERT INTO doc_sum_info (id,senderName,senderNube,filename,status,taskId,tgtLoc) VALUES ('${data.id}','${data.senderName}','${data.senderNube}','${data.filename}','${data.status}','${data.taskId}','${data.tgtLoc}') ON DUPLICATE KEY UPDATE id='${data.id}',senderName='${data.senderName}',senderNube='${data.senderNube}',filename='${data.filename}', status='${data.status}',taskId='${data.taskId}',tgtLoc='${data.tgtLoc}'`;
                    conn.query(str, (err, results, fields) => {
                        if (err) {
                            _logger.error("插入文档异常", err);
                            reject({code: '-1', des: '插入文档异常'});
                            if(conn){
                                conn.release();
                            }
                            return;
                        }
                        if (results) {
                            _logger.info("插入文档成功", results);
                            resolve({code: '0', des: '插入文档异常'});
                            if(conn){
                                conn.release();
                            }
                            return;
                        }
                        if (fields) {
                            _logger.error("插入文档失败", fields);
                            reject({code: '-1', des: '插入文档失败'});
                            if(conn){
                                conn.release();
                            }
                            return;
                        }
                    });
                }
            });
        })
    };

    /**
     * 获取
     * @param data
     * @returns {Promise<any>}
     */
    DBConnect.prototype.getDocChangeing = function () {
        return new Promise((resolve, reject) => {
            Pool.getConnection(function (err, conn) {
                if (err) {
                    _logger.error("获取转化中文档连接池异常", err);
                    reject({code: '-3', des: '获取转化中文档连接池异常', data: null});
                    if(conn){
                        conn.release();
                    }
                    return
                } else {
                    let str = `SELECT * FROM doc_sum_info WHERE status = '1'`;
                    conn.query(str, (err, results, fields) => {
                        if (err) {
                            _logger.error("获取转化中文档异常", err);
                            reject({code: '-1', des: '获取转化中文档异常'});
                            if(conn){
                                conn.release();
                            }
                            return;
                        }
                        if (results) {
                            _logger.info("获取转化中文档成功", results);
                            resolve({code: '0', des: '获取转化中文档成功', data: results});
                            if(conn){
                                conn.release();
                            }
                            return;
                        }
                        if (fields) {
                            _logger.error("获取转化中文档失败", fields);
                            reject({code: '-1', des: '获取转化中文档失败'});
                            if(conn){
                                conn.release();
                            }
                            return;
                        }

                    });
                }
            });
        })
    };

    /**
     * 获取
     * @param data
     * @returns {Promise<any>}
     */
    DBConnect.prototype.getDoc = function (data) {
        return new Promise((resolve, reject) => {
            Pool.getConnection(function (err, conn) {
                if (err) {
                    _logger.error("获取转化中文档连接池异常", err);
                    reject({code: '-3', des: '获取转化中文档连接池异常', data: null});
                    if(conn){
                        conn.release();
                    }
                    return
                } else {
                    let str = `SELECT * FROM doc_sum_info LEFT OUTER JOIN pic_info ON doc_sum_info.id=pic_info.id  WHERE senderNube = '${data.nube}'`;
                    conn.query(str, (err, results, fields) => {
                        if (err) {
                            _logger.error("获取文档异常", err);
                            reject({code: '-1', des: '获取文档异常'});
                            if(conn){
                                conn.release();
                            }
                            return;
                        }
                        if (results) {
                            _logger.info("获取文档成功", results);
                            let result = results;
                            result.forEach((item) => {
                                item.urls = item.urls ? item.urls.split(',') : []
                            });
                            resolve({code: '0', des: '获取文档成功', data: result});
                            if(conn){
                                conn.release();
                            }
                            return;
                        }
                        if (fields) {
                            _logger.error("获取文档失败", fields);
                            reject({code: '-1', des: '获取文档失败'});
                            if(conn){
                                conn.release();
                            }
                            return;
                        }
                    });
                }
            })
        })
    };

    DBConnect.prototype.insertDocPic = function (data) {
        return new Promise((resolve, reject) => {
            Pool.getConnection(function (err, conn) {
                if (err) {
                    _logger.error("获取转化中文档连接池异常", err);
                    reject({code: '-3', des: '获取转化中文档连接池异常', data: null});
                    if(conn){
                        conn.release();
                    }
                    return
                } else {
                    let str = `INSERT INTO pic_info (id,urls) VALUES ('${data.id}','${data.urls}') ON DUPLICATE KEY UPDATE id='${data.id}',urls='${data.urls}'`;
                    conn.query(str, (err, results, fields) => {
                        if (err) {
                            _logger.error("插入图片异常", err);
                            reject({code: '-1', des: '插入图片异常'});
                            if(conn){
                                conn.release();
                            }
                            return;
                        }
                        if (results) {
                            _logger.info("插入图片成功", results);
                            resolve({code: '0', des: '插入图片成功'});
                            if(conn){
                                conn.release();
                            }
                            return;
                        }
                        if (fields) {
                            _logger.error("插入图片失败", fields);
                            reject({code: '-1', des: '插入图片失败'});
                            if(conn){
                                conn.release();
                            }
                            return;
                        }

                    });
                }
            });
        })
    };

};
