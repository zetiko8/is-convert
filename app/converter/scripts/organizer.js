var path = require('path'),
    csv = require(path.join(__dirname, 'csvReader.js')),
    inputParser = require(path.join(__dirname, 'inputParser.js'));

module.exports = function (data, name) {

    // excel handler
    data = data.replace(/;/g, ",");

    if (name.endsWith('InternetneSkupine.csv') || name.endsWith('InternetneSkupine.txt')) {
        var jsonData = csv.internetGroups(data);
        console.log(JSON.parse(jsonData));
        return { data: jsonData, name: 'InternetneSkupine'};
    }
    if (name.endsWith('ProduktneSkupine.csv') || name.endsWith('ProduktneSkupine.txt')) {
        var jsonData = csv.productGroups(data);
        console.log(JSON.parse(jsonData));
        return {data: jsonData, name: 'ProduktneSkupine'};
    }
    if (name.endsWith('Napisi.csv') || name.endsWith('Napisi.txt')){
        var jsonData = csv.labels(data);
        console.log(JSON.parse(jsonData));
        return {data: jsonData, name: 'Napisi'};
    }

    var jsonData = csv.product(data);
    var objData = inputParser.parse(jsonData);
    if (objData.msg != null) {
        console.log("To je izjema");
    }
    console.log(objData);
    return {data: JSON.stringify(objData), name: objData.id};
}



