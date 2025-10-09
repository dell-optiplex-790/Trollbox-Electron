"use strict";
var { minify_sync } = require('terser');
var fs = require('fs');
var path = require('path');
var cachePath = path.join(__dirname, '..', 'cache');
console.log('Minifying...');
var fileList = fs.readdirSync(cachePath).filter(e=>e.endsWith('.js'));
for(var i = 0; i < fileList.length; i++) {
    var minified = minify_sync(fs.readFileSync(path.join(cachePath, fileList[i]), 'utf8'), {
        'ie8': true,
        'safari10': true,
        'ecma': 5,
        'mangle': {
            'toplevel': true
        }
    });
    fs.writeFileSync(path.join(cachePath, fileList[i]), minified.code);
}

console.log('Process finished.')