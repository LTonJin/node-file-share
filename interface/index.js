const Contrl = require('../controller');

module.exports = io => {
    Contrl.init();
    io.on('connection', socket => {
        /**
         * 加入会议
         */
        socket.on('joinMeeting', async data => {
            socket.join(data.meetingId);
            let result = await Contrl.joinMeeting(data, socket,io);
            socket.emit('onJoinMeeting', result)
        });
        /**
         * 离开会议
         */
        socket.on('leaveMeeting', async data => {
            let result = await Contrl.leaveMeeting(data);
            socket.emit('onLeaveMeeting', result);
            socket.leave(data.meetingId);
        });
        /**
         * 获取文档列表
         */
        socket.on('getDocList', async data => {
            let result = await Contrl.getDocList(data);
            socket.emit('onGetDocList', result);
        });
        /**
         * 文档转化图片
         */
        socket.on('docChangeImg', async data => {
            Contrl.docChangeImg(data, socket);
        });

        /**
         * 分享
         */
        socket.on('startShare', async data => {
            let result = await Contrl.startShare(data, socket);
            socket.emit('onStartShare', result);
        });

        /**
         * 结束分享
         */
        socket.on('stopShare', async data => {
            let result = await Contrl.stopShare(data, socket);
            socket.emit('onStopShare', result);
        });

        /**
         * 选择图片
         */
        socket.on('selectImg', async data => {
            let result = await Contrl.selectImg(data, socket);
            socket.emit('onSelectImg', result);
        });

        /**
         * 标注
         */
        socket.on('mark', async data => {
            let result = await Contrl.mark(data, socket);
            socket.emit('omMark', result);
        });
    });
    io.on('disconnect', function (socket) { // 这里监听 disconnect，就可以知道谁断开连接了
        console.log('disconnect: ' + socket.id);
    });
};
