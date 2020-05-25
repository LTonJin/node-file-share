const path = require('path')
const CopyPlugin = require('copy-webpack-plugin');
const {
  CleanWebpackPlugin
} = require('clean-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
let externals = _externals();

module.exports = {
  mode: 'production',
  entry: {
    main: './main.js',
  },
  target: 'node',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  externals: externals,
  node: {
    console: true,
    global: true,
    process: true,
    Buffer: true,
    __filename: true,
    __dirname: true,
    setImmediate: true
  },
  // module: {
  //   rules: [{
  //     test: /\.js$/,
  //     loader: 'babel-loader',
  //     exclude: /node_modules/
  //   }]
  // },
  plugins: [
    new CleanWebpackPlugin(), // 在打包之前，可以删除dist文件夹下的所有内容
    new CopyPlugin({
      patterns: [{
          from: 'public/',
          to: 'public/'
        },
        {
          from: 'config/',
          to: 'config/'
        }, 
        {
          from: 'app.js',
          to: ''
        }
      ],
    }),
    // new UglifyJsPlugin()
  ]
};

function _externals() {
  let manifest = require('./package.json');
  let dependencies = manifest.dependencies;
  let externals = {};
  for (let p in dependencies) {
    externals[p] = 'commonjs ' + p;
  }
  return externals;
}
