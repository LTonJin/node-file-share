```js
//ConstConfig.js 文件配置说明
const config = {};
// 服务器IP地址配置
config.server_url = '192.168.1.128';
// 端口配置
config.port = 4000;

```



```powershell
npm install 
# 不打包启动项目
node app.js # 启动node服务

# 打包启动项目
npm run build # 打包文件
cd dist # 进入dist文件夹
node app.js # 启动node服务
```