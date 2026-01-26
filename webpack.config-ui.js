var { join } = require('path');
var fs = require('fs');
var CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: 'production',
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
    target: ['web', 'es5'],
    output: {
        filename: 'index.js',
        path: join(__dirname, 'cache')
    },
    entry: {
        main: "./src/index.ts",
    }
}