const remote = require('electron').remote
const BrowserWindow = remote.BrowserWindow;
const dialog = remote.dialog;
const converter = require('../../../converter/main.js');
const validate = require("./validator.js");
const fileManager = require('../../../data/fileManager.js');
const path = require('path'); 
const fs = require('fs');



// get element
var outputFolder = document.getElementById("outputFolder");
var getOutputFolder = document.getElementById("getOutputFolder");
var convert = document.getElementById("convert");
var demoFolder = document.getElementById("demoFolder");
var getDemoFolder = document.getElementById("getDemoFolder");
var demo = document.getElementById("demo");

// add event listeners
getOutputFolder.addEventListener("click", getOutputFolderF);
getDemoFolder.addEventListener("click", getDemoFolderF);
convert.addEventListener("click", convertF);
demo.addEventListener("click", demoF);


function convertF() {

    if (!validate.folder(outputFolder.value)) { throw Error(); }

    dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] }, function (filenames) {

        for (let i = 0; i < filenames.length; i++) {
            if (!validate.fileName(filenames[i])) { throw Error(); }
        }

        converter(filenames, outputFolder.value);

    });

    
}
function getOutputFolderF() {

    dialog.showOpenDialog({ properties: ['openDirectory'] }, function (folder) {

        outputFolder.value = folder;

    });

    
}
function demoF() {
    if(!validate.folder(demoFolder.value)){throw Error();}
    
    fs.writeFileSync(
        path.join(__dirname, '../../../data/uploads/demoFolder.txt'), 
        demoFolder.value,
    );

    demoWindow = new BrowserWindow({
        height: 800,
        width: 800,
        resizable: true,
    });

    demoWindow.loadURL('file://' + __dirname + '../../../demo/index.html');

    demoWindow.on('closed', function () {

        demoWindow = null
    })


}
function getDemoFolderF() {
    dialog.showOpenDialog({ properties: ['openDirectory'] }, function (folder) {
        demoFolder.value = folder;

    });
   
}