var fs = require('fs');
module.exports = {
    folder : fo,
    fileName : fn,
}

function fo(name){
    console.log(name);
    if(name !== undefined) {if(fs.statSync(name).isDirectory()) return true;} else return true;
    
    
    return false;
}
function fn(name){
    if(name === "" || name === undefined || name === null) return false;
    return true;
}