var { join } = require('path');
var fs = require('fs');
var CopyPlugin = require("copy-webpack-plugin");
var nodeExternals = require('webpack-node-externals');

module.exports = {
    mode: 'production',
    target: ['node'],
    output: {
        filename: 'main.js',
        path: join(__dirname, 'cache')
    },
    entry: {
        main: "./src/main.ts",
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            { test: /\.ts$/, use: 'ts-loader' },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "assets", to: "." },
                { from: "package.json", to: "./"},
                { from: "LICENSE", to: "./"},
            ],
        }),
        {
            apply: function(compiler) {
                compiler.hooks.done.tap("EasyLaunchPlugin", () => {
                    const easylaunch = require('./helpers/easylaunch');
                    fs.writeFileSync('cache/easylaunch.bat', easylaunch.windows.run);
                    fs.writeFileSync('cache/easylaunch_installpkg.bat', easylaunch.windows.install);
                    fs.writeFileSync('cache/easylaunch.sh', easylaunch.unix.run);
                    fs.writeFileSync('cache/easylaunch_installpkg.sh', easylaunch.unix.install);
                })
            }
        }
    ],
    externals: [nodeExternals()],
    externalsPresets: {
        node: true
    },
}