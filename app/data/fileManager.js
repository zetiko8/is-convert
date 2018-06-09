/** Manages file savings, readings, and deletion */
var path = require('path');
var fs = require('fs');

module.exports = {
    readFile: function (filePath) {
        return new Promise(function (resolve, reject) {
            fs.readFile(filePath, "utf8", function (err, data) {
                if (err) { reject(err) }
                else {
                    resolve(data);
                }
            })
        });
    },
    writeFile: function (data, name, savePath) {
        return new Promise(function (resolve, reject) {
            fs.writeFile(path.join(savePath, name + '.txt'), data, function (err) {
                if (err) {
                    reject(err)
                }
                resolve(true);
            });
        });
    },
}