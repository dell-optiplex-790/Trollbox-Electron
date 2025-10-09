"use strict";

var JSZip = require('jszip');
var archive = new JSZip();
var fs = require('fs');
var path = require('path');
var cachePath = path.join(__dirname, '..', 'cache');
console.log('Generating archive...');
var fileList = fs.readdirSync(cachePath);
for(var i = 0; i < fileList.length; i++) {
    archive.file(fileList[i], fs.readFileSync(path.join(cachePath, fileList[i]), 'binary'), {compressionOptions: {level: 9}, binary: true})
}
archive.generateAsync({type: "nodebuffer"}).then(e => {
    fs.writeFileSync(path.join(__dirname, '..', 'build.zip'), e);
    console.log('Cleaning up...')
    fs.rmSync(cachePath, {recursive: true});
    console.log('Process complete.')
})