const koa = require('koa');
const app = new koa();
const path = require('path');
const koaStatic = require('koa-static');
const fs = require("fs");

const options = {
    key: fs.readFileSync('./public/ssl/mycert.key'),  //ssl文件路径
    cert: fs.readFileSync('./public/ssl/mycert.pem')  //ssl文件路径
};
const httpsServer = require('https').Server(options,app.callback());

const io = require('socket.io')(httpsServer);
const DB = require("./DB/DBConnect");
const dbConnect = new DB();
const middleWare = require('./middleware');
const interfaceSign = require('./interface');

dbConnect.init().then((info) => {
    middleWare(app);
    interfaceSign(io);
}).catch((err) => {
    console.log(err);
});


const home = koaStatic(path.join(__dirname)+'/public/');
app.use(home);

httpsServer.listen(Config.port, () => {
    console.log(`${Config.server_url}:${Config.port}`);
});
