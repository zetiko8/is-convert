var path = require('path');
var throwing = require(path.join(__dirname, '/exceptions.js'))
var $ = {
    csv: require(path.join(__dirname, 'libraries/jquery.csv.js'))
}

var homeLanguage = "en";


/**
*  Objekt naming se uporablja za poimenovanje v .csv dokumentu 
*/
var naming = {
    property: {
        imeZnacilnosti: "ImeZnacilnosti",
        nazivZnaclinosti: "NazivZnacilnosti",
        opombeZnacilnosti: "OpombeZnacilnosti",
    },
    option: {
        delNarocniskeKode: "DelNarocniskeKode",
        nazivOpcije: "NazivOpcije",
        opombeOpcije: "OpombeOpcije",
        omejitve: "Omejitve",
        privzetaVrednost: "PrivzetaVrednost"
    },
    productGroup: {
        idProduktneSkupine: "IdProduktneSkupine",
        idProdukta: "IdProdukta",
    },
    languageIndicator: "=",
    defaultLanguage: "sl"
}

/**
 *  Ustvari Product Type
 *  @param data - dobi celoten, neobdelan csv c String obliki.
 *  @returns - Objekt{}, ki vsebuje vse Properties in njim pripadajoče Options.
 *             Npr: {name: "H_SQ02x4 V1.01", properties: Array(10)}
 * 
 *  kliče jo : @csvJSON() (v this.return segmentu)
 */
function createProductTypeObject(data) {

    // podatki se razdelijo v array Stringov od ene omembe "ImeZnacilnosti" do druge.
    data = data.split(naming.property.imeZnacilnosti);

    // ekstrakta podatke o prodktivnem Tipu
    var productType = $.csv.toObjects(data[0])[0];

    var name = {};
    var description = {};
    for (var key in productType) {

        if (key.startsWith("NazivProdukta")) {

            var objTag = "";
            for (let l = 0; l < key.length; l++) {
                if (key.charAt(l) == "=") {
                    for (let ll = l + 1; ll < key.length; ll++) {
                        objTag += key.charAt(ll);
                    }
                }
            }
            name[objTag] = productType[key];

            delete productType[key];
        }

        if (key.startsWith("OpisProdukta")) {

            var objTag = "";
            for (let l = 0; l < key.length; l++) {
                if (key.charAt(l) == "=") {
                    for (let ll = l + 1; ll < key.length; ll++) {
                        objTag += key.charAt(ll);
                    }
                }
            }
            description[objTag] = productType[key];

            delete productType[key];
        }
    }
    productType.id = productType.IdProdukta;
    delete productType.IdProdukta;
    delete productType[''];
    productType.name = name;
    productType.description = description;

    // ustvarjanje Značilnosti produktnega tipa
    var properties = [];

    // vsak kos texta, ločenega po Značilnostih se pošlje skozi funkcijo @createPropertyObject,
    // ki vrne objekt{} strukture: {id, name, notes, options}, ki e+je naložen v properties[].
    for (var i = 1; i < data.length; i++) {             // (for loop se začne na 1, ker je i=0 imeProduktnegaTipa)
        properties.push(createPropertyObject(data[i]));
    }

    return {
        id: productType.id,
        name: productType.name,
        description: productType.description,
        properties: properties
    }
}

/**
 *  Ustvari Značilnost
 *  @param data - dobi neobdelan <string>, ki vsebuje vse podatke o eni značilnosti 
 *  @returns - objekt strukture {id, name, notes, options}
 *      
 *      uporablja : knjižnico "javascripts\jquery-csv-master\src\jquery.csv.js", za pretvorbo .csv v objekt{}
 * 
 *  kliče jo : @createProductTypeObject()
 */
function createPropertyObject(data) {

    // console.log(data);

    // string.split(delimeter) odstrani iz rezultata[] delimeter, zato je tu dodan nazaj. To je zapotrebe knjižnice za branje .csv
    data = naming.property.imeZnacilnosti + data;

    // ekstrahira podatke o značilnosti
    data = data.split(naming.option.delNarocniskeKode); // razdeli dan data<String> glede na ključno besedo "DelNarocniskeKode". S tem loči podatke o znacilnosti od podatkov o tej znacilnosti pripadajočih opcijah
    var propertyData = data[0];                             // prvi del[0] propertyData[] so podatki o značilnosti. 
    var property = $.csv.toObjects(propertyData)[0];        // Tu je oblikovan v Objekt{}. 

    // proba popraviti problem napačne sintakse, v primeru, da je dodan še en line
    if (property == null) { throw throwing.extraLineException(data[0]); }

    var propertyName = {};
    var propertyNotes = {};
    for (var key in property) {

        if (key.startsWith(naming.property.nazivZnaclinosti)) {

            var objTag = "";
            for (let i = 0; i < key.length; i++) {
                if (key.charAt(i) == "=") {
                    for (let ii = i + 1; ii < key.length; ii++) {
                        objTag += key.charAt(ii);
                    }
                }
            }
            propertyName[objTag] = property[key];
        }

        if (key.startsWith(naming.property.opombeZnacilnosti)) {

            var objTag = "";
            for (let i = 0; i < key.length; i++) {
                if (key.charAt(i) == "=") {
                    for (let ii = i + 1; ii < key.length; ii++) {
                        objTag += key.charAt(ii);
                    }
                }
            }
            propertyNotes[objTag] = property[key];
        }
    }

    // ekstrahira podatke o opcijah, pripadajočih tej značilnosti
    var optionData = naming.option.delNarocniskeKode + data[1];
    var optionObjects = $.csv.toObjects(optionData);

    // vsak objekt v optionObjects je poslan skozi funkcijo @createOptionObject in naložen v options[]
    var options = [];
    var defaultOption = undefined;
    for (var i = 0; i < optionObjects.length; i++) {
        options.push(createOptionObject(optionObjects[i]));
        // improvizacija glede DEFAULT
        if (optionObjects[i][naming.option.privzetaVrednost] == "TRUE") {
            defaultOption = optionObjects[i][naming.option.delNarocniskeKode];
        }
        // TO DO !! - dokumentacija
    }
    // vrnjen je objekt 
    return {
        id: property[naming.property.imeZnacilnosti],
        name: propertyName,
        notes: propertyNotes,
        options: options,
        defaultOption: defaultOption
    }
}

/**
 *  Ustvari Opcijo
 *  @param option - je optionObject{} Npr. : {DelNarocniskeKode: "SQ0104", NazivOpcije=sl: "", NazivOpcije=en: "", NazivOpcije=de: "", OpombeOpcije=sl: "", …}
 *  @returns - isti objekt, ki vsebuje le še poimenovanja iz relevantnega jezika 
 *                  npr. {code: "N", default: "TRUE", constraints: ""} 
 * 
 *  kliče jo: @createPropertyObject()
 */
function createOptionObject(option) {

    var optionName = {};
    var optionNotes = {};
    for (var key in option) {

        if (key.startsWith(naming.option.nazivOpcije)) {

            var objTag = "";
            for (let i = 0; i < key.length; i++) {
                if (key.charAt(i) == "=") {
                    for (let ii = i + 1; ii < key.length; ii++) {
                        objTag += key.charAt(ii);
                    }
                }
            }
            optionName[objTag] = option[key];
        }

        if (key.startsWith(naming.option.opombeOpcije)) {

            var objTag = "";
            for (let i = 0; i < key.length; i++) {
                if (key.charAt(i) == "=") {
                    for (let ii = i + 1; ii < key.length; ii++) {
                        objTag += key.charAt(ii);
                    }
                }
            }
            optionNotes[objTag] = option[key];
        }
    }

    // TO DO !! - dokumentacija

    var constraints = option[naming.option.omejitve];

    // improvizacija, menjava single quotesov
    for (var i = 0; i < constraints.length; i++) {

        if (constraints.charCodeAt(i) == 8217) {

            var x = constraints;
            constraints = constraints.substring(0, i) + "'" + constraints.substring(i + 1);

        }
    }

    return {
        code: option[naming.option.delNarocniskeKode],
        name: optionName,
        notes: optionNotes,
        default: option[naming.option.privzetaVrednost],
        constraints: constraints,
    }
}

function createProductGroups(data) {

    data = data.split(naming.productGroup.idProduktneSkupine);
    var productGroups = [];
    for (let i = 1; i < data.length; i++) {
        productGroups.push(createProductGroup(naming.productGroup.idProduktneSkupine + data[i]));
    }

    return productGroups;
}

function createProductGroup(data) {
    data = data.split(naming.productGroup.idProdukta);
    productGroup = $.csv.toObjects(data[0])[0];

    var name = {};
    var description = {};
    for (var key in productGroup) {

        if (key.startsWith("NazivProduktneSkupine")) {
            var objTag = "";
            for (let l = 0; l < key.length; l++) {
                if (key.charAt(l) == "=") {
                    for (let ll = l + 1; ll < key.length; ll++) {
                        objTag += key.charAt(ll);
                    }
                }
            }
            name[objTag] = productGroup[key];

            delete productGroup[key];
        }

        if (key.startsWith("OpisProduktneSkupine")) {

            var objTag = "";
            for (let l = 0; l < key.length; l++) {
                if (key.charAt(l) == "=") {
                    for (let ll = l + 1; ll < key.length; ll++) {
                        objTag += key.charAt(ll);
                    }
                }
            }
            description[objTag] = productGroup[key];

            delete productGroup[key];
        }
    }
    productGroup.description = description;
    productGroup.name = name;
    productGroup.products = createProducts($.csv.toObjects(naming.productGroup.idProdukta + data[1]));
    productGroup.id = productGroup.IdProduktneSkupine;
    delete productGroup.IdProduktneSkupine;

    return productGroup;
}

function createProducts(productsData) {
    var products = [];
    for(let i = 0; i<productsData.length; i++){
        products.push(createProduct(productsData[i]));
    }
    return products

}

function createProduct(productType){
    var name = {};
    var description = {};

    for (var key in productType) {

        if (key.startsWith("NazivProdukta")) {

            var objTag = "";
            for (let l = 0; l < key.length; l++) {
                if (key.charAt(l) == "=") {
                    for (let ll = l + 1; ll < key.length; ll++) {
                        objTag += key.charAt(ll);
                    }
                }
            }
            name[objTag] = productType[key];

            delete productType[key];
        }

        if (key.startsWith("OpisProdukta")) {

            var objTag = "";
            for (let l = 0; l < key.length; l++) {
                if (key.charAt(l) == "=") {
                    for (let ll = l + 1; ll < key.length; ll++) {
                        objTag += key.charAt(ll);
                    }
                }
            }
            description[objTag] = productType[key];

            delete productType[key];
        }
    }
    productType.id = productType.IdProdukta;
    delete productType.IdProdukta;
    // delete productType[''];
    productType.name = name;
    productType.description = description;

    return productType;
}

function createInternetGroups(data) {
    var internetGroups = $.csv.toObjects(data);

    for (let i = 0; i < internetGroups.length; i++) {

        var productGroups = [];
        var id = {};


        for (var key in internetGroups[i]) {

            // TO DO startsWith() = naming.itd
            if (key.startsWith("ProduktnaSkupina")) {

                if (internetGroups[i][key] != "") {
                    productGroups.push(internetGroups[i][key]);
                }
                delete internetGroups[i][key];
            }

            if (key.startsWith("IdInternetneSkupine")) {

                var objTag = "";
                for (let l = 0; l < key.length; l++) {
                    if (key.charAt(l) == "=") {
                        for (let ll = l + 1; ll < key.length; ll++) {
                            objTag += key.charAt(ll);
                        }
                    }
                }
                id[objTag] = internetGroups[i][key];

                delete internetGroups[i][key];
            }

            internetGroups[i].id = id;
            internetGroups[i].productGroups = productGroups;
        }


    } return internetGroups;
}

module.exports = {
    product: function (data) {

        try {
            // console.log(data);
            return JSON.stringify(createProductTypeObject(data));

        } catch (error) {
            throwing.handleException(error);
            return error;
        }

    },
    productGroups: function (data) {
        return JSON.stringify(createProductGroups(data));
    },
    internetGroups: function (data) {
        return JSON.stringify(createInternetGroups(data));
    }
}


