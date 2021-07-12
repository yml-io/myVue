const { resolve } = require("path");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: [
        // 由于 index.html 等html文件
        // 不在依赖跟踪里面所以不会进行 HMR
        "./src/index.js",
    ],
    output: {
        filename: "[name]-bundle-[fullhash:10].js",
        path: resolve(__dirname, "dist")
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    "style-loader",
                    "css-loader"
                ],
            },
            {
                test: /\.less$/,
                use: [
                    "style-loader",
                    "css-loader",
                    // 需要安装 less 和 less-loader
                    "less-loader"
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: resolve(__dirname, "src", "static", "index.html")
        }),
        // HMR modules
        // new webpack.HotModuleReplacementPlugin(),
        // new webpack.NoEmitOnErrorsPlugin()
    ],
    mode: "development",
    // webpack-dev-server
    devServer: {
        host: "localhost",
        port: 5001,
        // recompile [JS module] when js file modified
        hot: true,
        // refresh page when recompile [JS module]
        inline: true,
        open: true,
        compress: true,
        watchContentBase: true,
        contentBase: resolve(__dirname, "dist"),
        // watchOptions: {
        //     poll: true
        // }
    }
}



