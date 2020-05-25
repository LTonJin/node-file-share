
const RPCClient = require('@alicloud/pop-core');
let OSS = require('ali-oss');
const DB = require('../DB/DBConnect');
const BLogger = require('../DB/ButelLogger');
const _logger = new BLogger("Controller", 4);
const dbConnect = new DB();
const Controller = {
    meetingData: {},
    socketData: {},
    /**
     * 初始化
     */
    init: async () => {
        // 服务器获取正在转化中的文档
        let result = await dbConnect.getDocChangeing();
        result.data.forEach((item) => {
            item.TaskId = item.taskId;
            item.TgtLoc = item.tgtLoc;
            let interVal = setInterval(async () => {
                // 查询转化进度
                let progress = await Controller.checkDocChangeImgProgressFactory(item);
                if (progress && progress.Status === 'Finished' || progress && progress.Status === 'Failed') {
                    clearInterval(interVal);
                    status = progress.Status === 'Running' ? '1' : progress.Status === 'Finished' ? '2' : '0';
                    des = progress.Status === 'Running' ? '转化中' : progress.Status === 'Finished' ? '转化完成' : '转化失败';
                    let obj = {
                        senderNube: item.senderNube,
                        filename: item.filename,
                        status: status,
                        senderName: item.senderName,
                        id: item.id,
                        taskId: item.TaskId,
                        TgtLoc: item.tgtLoc
                    };
                    // 改变数据库 （成功的状态）
                    let instate = await Controller.insertDoc(obj);
                    //阿里查询图片列表
                    let imgList = await Controller.getImgList(item);
                    let doc_pic = {
                        id: item.id,
                        urls: imgList.data ? imgList.data.join() : ''
                    };
                    let insertPicResult = await Controller.insertPic(doc_pic);
                }
            }, 500);
        })
    },
    /**
     * 加入会议
     * @param data
     * @returns {Promise<{code: string, des: string, data: null}>}
     */
    joinMeeting: async (data, socket, io) => {
        if (!data.meetingId || !data.name || !data.nube) {
            return {code: '-3', des: '参数错误', data: null}
        }
        return await Controller.joinFactory(data, socket, io)
    },

    /**
     * 离开会议
     * @param data
     * @returns {Promise<{code: string, des: string, data: null}>}
     */
    leaveMeeting: async (data) => {
        if (!data.meetingId || !data.name || !data.nube) {
            return {code: '-3', des: '参数错误', data: null}
        }
        let result = await Controller.leaveFactory(data);
        Controller.refactMeetingData(data);
        return result;
    },

    /**
     * 获取文档列表
     * @param data
     */
    getDocList: async (data) => {
        if (!data.name || !data.nube) {
            return {code: '-3', des: '参数错误', data: null}
        }
        return await Controller.docListFactory(data)

    },

    /**
     * 文档转化图片
     * @param data
     */
    docChangeImg: async (data, socket) => {
        if (!data.nube || !data.name || !data.filename || !data.id || !data.file) {
            socket.emit('onDocChangeImg', {code: '-3', des: '参数错误', data: null});
            return;
        }
        function guid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        // 如果上传的为图片则直接插入数据库
        if (data.file.url) {
            let obj = {
                senderNube: data.nube,
                filename: data.filename,
                status: '2',
                senderName: data.name,
                id: data.id,
                taskId: guid(),
                tgtLoc: guid()
            };
            let instate = await Controller.insertDoc(obj);
            let insertPicResult = await Controller.insertPic({ id: data.id, urls: data.file.url });
            if (instate.code === '0' && insertPicResult.code === '0') {
                socket.emit('onDocChangeImg', { code: '0', status: '2', des: '转化完成', data: null });
            } else {
                socket.emit('onDocChangeImg', { code: '-3', status: '数据库异常', des: '转化失败', data: null });
            }
            return;
        }
        let result = await Controller.docChangeImgFactory(data);
        if (result) {
            let status = result.Status === 'Running' ? '1' : result.Status === 'Finished' ? '2' : '0';
            let des = result.Status === 'Running' ? '转化中' : result.Status === 'Finished' ? '转化完成' : '转化失败';
            // 写入数据库状态，返回什么状态就写入什么状态
            let obj = {
                senderNube: data.nube,
                filename: data.filename,
                status: status,
                senderName: data.name,
                id: data.id,
                taskId: result.TaskId,
                tgtLoc: result.TgtLoc
            };
            let instate = await Controller.insertDoc(obj);
            let insertPicResult = await Controller.insertPic({id: data.id, urls: ''});
            if (instate.code === '0' && insertPicResult.code === '0') {
                socket.emit('onDocChangeImg', {code: '0', status: status, des: des, data: null});
            } else {
                socket.emit('onDocChangeImg', {code: '-3', status: '数据库异常', des: des, data: null});
            }
            if (status === '1') {
                // 判断如果是转化中，一直查询
                let interVal = setInterval(async () => {
                    let progress = await Controller.checkDocChangeImgProgressFactory(result);
                    if (progress && progress.Status === 'Finished' || progress && progress.Status === 'Failed') {
                        clearInterval(interVal);
                        status = progress.Status === 'Running' ? '1' : progress.Status === 'Finished' ? '2' : '0';
                        des = progress.Status === 'Running' ? '转化中' : progress.Status === 'Finished' ? '转化完成' : '转化失败';
                        let obj = {
                            senderNube: data.nube,
                            filename: data.filename,
                            status: status,
                            senderName: data.name,
                            id: data.id,
                            taskId: result.TaskId,
                            tgtLoc: result.TgtLoc
                        };

                        //阿里查询图片列表
                        let imgList = await Controller.getImgList(result);
                        let doc_pic = {
                            id: data.id,
                            urls: imgList.data ? imgList.data.join() : ''
                        };
                        // 改变数据库 （成功的状态）
                        let instate = await Controller.insertDoc(obj);
                        let insertPicResult = await Controller.insertPic(doc_pic);

                        if (instate.code === '0' && insertPicResult.code === '0') {
                            socket.emit('onDocChangeImg', {code: '0', status: status, des: des, data: null});
                        } else {
                            socket.emit('onDocChangeImg', {code: '-3', status: '数据库异常', des: des, data: null});
                        }
                    }
                }, 500);
            }
        } else {
            let obj = {
                senderNube: data.nube,
                filename: data.filename,
                status: 0,
                senderName: data.name,
                id: data.id,
                taskId: result.TaskId,
                tgtLoc: result.TgtLoc
            };
            let instate = await Controller.insertDoc(obj);
            socket.emit('onDocChangeImg', {code: '0', status: '0', des: '转化失败', data: null});
        }
    },

    /**
     * 分享
     * @param data
     */
    startShare: async (data, socket) => {
        if (!data.meetingId || !data.shareInfo) {
            return {code: '-3', des: '参数错误', data: null}
        }
        let result = await Controller.startShareFactory(data);
        socket.broadcast.to(data.meetingId).emit('onStartShareMsg', result.other);
        return result.mine;
    },

    /**
     * 结束分享
     * @param data
     */
    stopShare: async (data, socket) => {
        if (!data.meetingId || !data.nube || !data.name) {
            return {code: '-3', des: '参数错误', data: null}
        }
        let result = await Controller.stopShareFactory(data);
        socket.broadcast.to(data.meetingId).emit('onStopShareMsg', result.other);
        return result.mine;
    },

    /**
     * 选择图片
     * @param data
     */
    selectImg: async (data, socket) => {
        if (!data.meetingId || !data.shareInfo) {
            return {code: '-3', des: '参数错误', data: null}
        }
        let result = await Controller.selectImgFactory(data);
        socket.broadcast.to(data.meetingId).emit('onSelectImgMsg', result.other);
        return result.mine;
    },

    /**
     * 标注
     * @param data
     */
    mark: async (data, socket) => {
        if (!data.meetingId || !data.shareInfo) {
            return {code: '-3', des: '参数错误', data: null}
        }
        let result = await Controller.markFactory(data);
        socket.broadcast.to(data.meetingId).emit('omMarkMsg', result.other);
        return result.mine;
    },

    // ********************************************分割线*********************************************

    /**
     * 加入
     * @returns {{code: string, des: string, data: *}}
     */
    joinFactory: (data, socket, io) => {
        if (Controller.meetingData[data.meetingId]) {
            let list = Controller.meetingData[data.meetingId].meetingList;
            let has = false;
            let ind = -1;
            list.forEach((item, index) => {
                if (item.nube === data.nube) {
                    has = true;
                    ind = index;
                }
            });
            if (!has) {
                Controller.socketData[data.nube] = socket.id;
                Controller.meetingData[data.meetingId].meetingList.push({name: data.name, nube: data.nube})
            } else {
                try {
                    io.sockets.connected[Controller.socketData[data.nube]].emit('displacement', {
                        code: '0',
                        des: '你已在异地登陆',
                        data: null
                    });
                    io.sockets.connected[Controller.socketData[data.nube]].leave(data.meetingId);
                    Controller.meetingData[data.meetingId].meetingList[ind] = {name: data.name, nube: data.nube};
                    Controller.socketData[data.nube] = socket.id;
                } catch (e) {
                }
            }
            return {code: '0', des: '成功', data: Controller.meetingData[data.meetingId]};
        } else {
            Controller.socketData[data.nube] = socket.id;
            Controller.meetingData[data.meetingId] = {
                meetingId: data.meetingId,
                meetingList: [{name: data.name, nube: data.nube}],
                shareInfo: {
                    pageNum: '',
                    curPageNum: '',
                    curImgUrl: '',
                    shareName: '',
                    shareNube: '',
                    filename: '',
                    shareStatus: '',
                    id: ''
                }
            };
            return {code: '0', des: '成功', data: Controller.meetingData[data.meetingId]};
        }
    },

    /**
     * 离开
     * @returns {{code: string, des: string, data: *}}
     */
    leaveFactory: (data) => {
        if (Controller.meetingData[data.meetingId]) {
            let list = Controller.meetingData[data.meetingId].meetingList;
            let has = false, ind = -1;
            list.forEach((item, index) => {
                if (item.nube === data.nube) {
                    has = true;
                    ind = index;
                }
            });
            if (has) {
                Controller.meetingData[data.meetingId].meetingList.splice(1, ind)
            }
            return {code: '0', des: '成功', data: null};
        } else {
            return {code: '0', des: '成功', data: null};
        }
    },

    /**
     * 获取文档列表
     * @returns {Array}
     */
    docListFactory: async (data) => {
        return await dbConnect.getDoc(data);
    },

    /**
     * 文档转化图片
     * @returns {Array}
     */
    docChangeImgFactory: async (data) => {
        // 1,调用阿里接口转化，
        let client = new RPCClient({
            endpoint: config.popCoreData.endpoint,
            accessKeyId: config.popCoreData.accessKeyId,
            accessKeySecret: config.popCoreData.accessKeySecret,
            apiVersion: config.popCoreData.apiVersion
        });
        try {
            let result = await client.request("CreateOfficeConversionTask", data.file);
            return result
        } catch (err) {
            return null;
        }
    },

    /**
     * 检测文档转化图片进度
     * @returns {Array}
     */
    checkDocChangeImgProgressFactory: async (data) => {
        // 1,调用阿里接口转化，
        let client = new RPCClient({
            endpoint: config.popCoreData.endpoint,
            accessKeyId: config.popCoreData.accessKeyId,
            accessKeySecret: config.popCoreData.accessKeySecret,
            apiVersion: config.popCoreData.apiVersion
        });
        try {
            let params = {
                Project: config.popCoreData.project,
                TaskId: data.TaskId
            };
            let result = await client.request("GetOfficeConversionTask", params);
            return result
        } catch (err) {
            return null;
        }
    },

    /**
     * 删除会议人员为空的会议
     * @param data
     */
    refactMeetingData(data) {
        if (Controller.meetingData[data.meetingId] && Controller.meetingData[data.meetingId].meetingList.length === 0) {
            delete Controller.meetingData[data.meetingId]
        }
    },

    /**
     * 构造开始分享数据
     * @param data
     */
    startShareFactory: (data) => {
        if (Controller.meetingData[data.meetingId]) {
            data.shareInfo.shareStatus = '1';
            Controller.meetingData[data.meetingId].shareInfo = data.shareInfo;
            return {mine: {code: '0', des: '分享成功', data: null}, other: Controller.meetingData[data.meetingId]}
        } else {
            return {mine: {code: '-1', des: '服务器异常', data: null}, other: {code: '-1', des: '服务器异常', data: null}};
        }
    },

    /**
     * 构造结束分享数据
     * @param data
     */
    stopShareFactory: (data) => {
        if (Controller.meetingData[data.meetingId]) {
            Controller.meetingData[data.meetingId].shareInfo.shareStatus = '2';
            return {
                mine: {code: '0', des: '结束成功', data: null}, other: {
                    meetingId: data.meetingId,
                    shareInfo: {shareStatus: '2'}
                }
            }
        } else {
            return {mine: {code: '-1', des: '服务器异常', data: null}, other: {code: '-1', des: '服务器异常', data: null}};
        }
    },

    /**
     * 构造切换图片数据
     * @param data
     */
    selectImgFactory: (data) => {
        if (Controller.meetingData[data.meetingId]) {
            data.shareInfo.shareStatus = '1';
            Controller.meetingData[data.meetingId].shareInfo = data.shareInfo;
            return {mine: {code: '0', des: '切换成功', data: null}, other: Controller.meetingData[data.meetingId]}
        } else {
            return {mine: {code: '-1', des: '服务器异常', data: null}, other: {code: '-1', des: '服务器异常', data: null}};
        }
    },

    /**
     * 构造标注数据
     * @param data
     */
    markFactory: (data) => {
        if (Controller.meetingData[data.meetingId]) {
            data.shareInfo.shareStatus = '1';
            Controller.meetingData[data.meetingId].shareInfo = data.shareInfo;
            return {mine: {code: '0', des: '标注成功', data: null}, other: Controller.meetingData[data.meetingId]}
        } else {
            return {mine: {code: '-1', des: '服务器异常', data: null}, other: {code: '-1', des: '服务器异常', data: null}};
        }
    },

    /**
     * 阿里查询图片列表
     * @param data
     */
    getImgList: async (data) => {
        let client = new OSS({
            region: config.popCoreData.region,
            accessKeyId: config.popCoreData.accessKeyId,
            accessKeySecret: config.popCoreData.accessKeySecret,
            bucket: config.popCoreData.bucket
        });
        let dir = config.popCoreData.project + data.TgtLoc.split(config.popCoreData.project)[data.TgtLoc.split(config.popCoreData.project).length - 1] + '/';
        try {
            let result = await client.list({
                prefix: dir,
                delimiter: '/'
            });
            let urls = [];
            result.objects.forEach((item) => {
                urls.push(item.url)
            });
            return {code: '0', des: '成功', data: urls};
        } catch (e) {
            return {code: '-1', des: '失败', data: null}
        }

    },

    // *******************************************数据库******************************************

    insertDoc: (data) => {
        return new Promise(async (resolve, reject) => {
            let result = await dbConnect.insertDoc(data);
            if (result.code === '0') {
                resolve({code: '0', des: '成功', data: null})
            } else {
                reject({code: result.code, des: '插入文档操作数据库失败'})
            }
        });
    },
    insertPic: (data) => {
        return new Promise(async (resolve, reject) => {
            let result = await dbConnect.insertDocPic(data);
            if (result.code === '0') {
                resolve({code: '0', des: '成功', data: null})
            } else {
                reject({code: result.code, des: '插入图片操作数据库失败'})
            }
        });
    }
};


module.exports = Controller;
