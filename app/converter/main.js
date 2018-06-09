var fileManager = require("../data/fileManager.js");
var converter = require("./scripts/organizer.js");
var path = require('path')

function convert(filePath, outputFolder) {
    
    fileManager.readFile(filePath).then(function (file) {
        var json = converter(file, filePath);
        fileManager.writeFile(json.data, json.name, outputFolder).then(function(result){
            if(result) console.log("Saved file");
        })
    });
}
module.exports = function (filePaths, outputFolder) {
    for (let i = 0; i < filePaths.length; i++) {
        convert(filePaths[i], outputFolder);
    }
}