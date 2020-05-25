//ConstConfig.js 文件配置说明
const config = {};
// 服务器IP地址配置
config.server_url = '192.168.1.106';
// 端口配置
config.port = 4000;
// 阿里云转换文档相关配置
config.popCoreData = {
    region: 'oss-cn-shanghai',
    accessKeyId: 'LTAI4FvDErSmJH4VYvseqd79',
    accessKeySecret: 'RHGrPqm1c3kzlxUBRoyr80oj2QnLUS',
    endpoint: 'http://imm.cn-shanghai.aliyuncs.com',
    apiVersion: '2017-09-06',
    bucket: 'docsshare',
    project: 'docs-share',
};
config.CONNECT_STATE = {
    "OK": 0,        // 可正常使用
    'UNINIT': -1,   // 未初始化
};
config.DB_ERROR = {
    "OK": 0,                // 可正常使用
    'PARAMERROR': -1,       // 参数错误
    'STATEERROR': -2,       // 状态错误
    'CONNECTERROR': -3,     // 数据库连接错误
};
// 数据库相关配置
config.dbConfig = {
    host: '36.152.26.250',
    user: 'root',
    password: 'mysql_2019',
    port: 51001,
    database: 'test',
};
config.writeLogPath = 'C:\\ProgramData\\nodeFileShare.text';
module.exports = config;