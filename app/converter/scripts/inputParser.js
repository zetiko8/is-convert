var thisLocation = "Validator"
var path = require('path');
var throwing = require(path.join(__dirname, '/exceptions.js'));

var lm = require(path.join(__dirname, 'logicModule2.js'));
// console.log(lm);
/**
*   Validates productType
*   @param productType - object literal{} strukture ( Npr. "{name: "H_SQ02x4 V1.01", properties: Array(10)}" )
*   @returns - validiran productType{} iste strukture
*       validacija: 
*           .name   ( nabor znakov, not null ),
*           če objektnih lastnosti ni več kot 3 pass,
*           če property je več kot 0 pass 
*/
function validateProductType(productType) {

    var context = {
        location : thisLocation,
        entity : "Produktni tip",
        iteration : "",
        wronger : "",  // je nastavljen pri napaki
        thisId : productType.name,
        higherLevel : "" 
    }

    /* VALIDACIJA */

    // prouctType.name
    // Pogleda, če je nabor znakov ustrezen
    if (!charSetValidator(productType.name)) { context.wronger = productType.name; throw throwing.invalidCharSet(new throwing.Context(context)); }
    // Pogleda, če name ni undefined
    if (productType.id == null ||productType.id == "") { context.wronger = productType.id; throw throwing.missing(new throwing.Context(context)); }

    // productType.properties
    // Pogleda če lastnosti niso prazne 
    if (productType.properties == null) { context.wronger = productType.properties; throw throwing.invalidObject(new throwing.Context(context)); }
    // pogleda če ima produkt preveč lastnosti
    if (Object.keys(productType).length > 4) {
        context.wronger = productType.name; throw throwing.invalidObject(new throwing.Context(context));
    }
    // validira Properties
    propertiesArrValid = [];
    for (var i = 0; i < productType.properties.length; i++) {
        var current = validateProperty(productType.properties[i], propertiesArrValid, productType.name, i);
        propertiesArrValid.push(current);
    }
    productType.properties = propertiesArrValid;

    /*        */

    return productType;
}

/**
*   Validira Značilnosti
*   @param property - object literal{} strukture ( Npr. "{id: "CONNECT", name: "Connection", notes: "", options: Array(2), defaultOption: "N"}" )
*   @param propertiesArrValid - propertiesArrValid[] so že validirani properties. Potreben je, za validacijo unikatnosti objektnih lastnosti.
*   @returns - validiran productType{} iste strukture
*        validacija:
*               .id     ( nabor znakov, not null, unique(za productType) ),   
*               .name   ( nabor znakov, not null, unique ),
*               .notes  ( nabor znakov ),
*               če objektnih lastnosti ni več kot 5 pass TO DO !! (a ne bi blo bolš točno število?)
*               če options je več kot 0 pass
*/
function validateProperty(property, propertiesArrValid, productTypeName, iteration) {

    /* VALIDACIJA */
    var context = {
        location : thisLocation,
        entity : "Znacilnost",
        iteration : iteration,
        wronger : "",  // je nastavljen pri napaki
        thisId : property.id,
        higherLevel : productTypeName 
    }

    // property,id
    // Pogleda, če je nabor znakov ustrezen 
    if (!charSetValidator(property.id)) { context.wronger = property.id; throw throwing.invalidCharSet(new throwing.Context(context)); }
    // Pogleda če id ni undefined
    if (property.id == null || property.id == "") {context.wronger = property.id; throw throwing.missing(context); }

    // property.name
    // Pogleda, če je nabor znakov ustrezen
    if (!charSetValidator(property.name)) { context.wronger = property.name; throw throwing.invalidCharSet(new throwing.Context(context)); }
    // Pogleda če name ni undefined
    if (property.name == null) {context.wronger = property.name; throw throwing.missing(new throwing.Context(context)); }

    // Notes
    // Pogleda, če je nabor znakov ustrezen
    if (!charSetValidator(property.notes)) { context.wronger = property.notes; throw throwing.invalidCharSet(new throwing.Context(context)); }

    // validacija unikatnosti property.name in property.id
    for (var i = 0; i < propertiesArrValid.length; i++) {
        if (property.name == propertiesArrValid[i].name) {            // pogleda, če ne obstaja že property z istim property.name
            context.wronger = property.name; throw throwing.notUnique(new throwing.Context(context));
        }
        if (property.id == propertiesArrValid[i].id) {                // pogleda, če ne obstaja že property z istim property.id
            context.wronger = property.id; throw throwing.notUnique(new throwing.Context(context));
        }
    }

    // pogleda če ima znacilnost dodatne opcije
    if (Object.keys(property).length > 5) {
        context.wronger = property.id; throw throwing.invalidObject(new throwing.Context(context));
    }

    // property.options
    // Pogleda če opcije niso prazne
    if (property.options == null) { context.wronger = property.options; throw throwing.missing(new throwing.Context(context)); }

    optionsArrValid = []
    for (var i = 0; i < property.options.length; i++) { // @validateOptions Validira opcije + !!! prebere resničnostne pogoje (constraints) !!!
        curr = validateOptions(property.options[i], optionsArrValid, property.name, i);
        optionsArrValid.push(curr);
    }
    property.options = optionsArrValid;

    /*            */

    return property;
}

/**
*   Validira Značilnosti
*   @param option - object literal{} strukture ( Npr. "{code: "L", name: "Phase to Phase (L-L)", notes: "", default: "", constraints: ""}" )
*   @param optionsArrValid - optionsArrValid[] so že validirani options. Potreben je, za validacijo unikatnosti objektnih lastnosti.
*   @returns -  validiran options{}.
*               !!! poleg validacije, kliče tudi @logicModule.readPropopostion(), kjer se option.constraints prevede v new Proposition()
*        validacija:
*              .code   ( nabor znakov, not null, unique(za property) ),
*              .name   ( nabor znakov )
*              .notes  ( nabor znakov )
*              če objektnih lastnosti ni več kot 5 pass
*              (.constraints - ima svojo validacijo v @logicModule )
*/
function validateOptions(option, optionsArrValid, propertyName, iteration) {

    var context = {
        location : thisLocation,
        entity : "Opcija",
        iteration : iteration,
        wronger : "",  // je nastavljen pri napaki
        thisId : option.name,
        higherLevel : propertyName 
    }
    
    // console.log(option);
    /* VALIDACIJA */

    // option.code
    // Pogleda, če je nabor znakov ustrezen 
    if (!charSetValidatorOrderCode(option.code)) { context.wronger = option.code; throw throwing.invalidCharSet(new throwing.Context(context)); }
    // Pogleda če code ni undefined
    if (option.code == null || option.code == "") { context.wronger = option.code; throw throwing.missing(new throwing.Context(context)); }

    // property.name
    // Pogleda, če je nabor znakov ustrezen
    if (!charSetValidator(option.name)) { context.wronger = option.name; throw throwing.invalidCharSet(new throwing.Context(context));  }

    // Notes
    // Pogleda, če je nabor znakov ustrezen
    if (!charSetValidator(option.notes)) { context.wronger = option.notes; throw throwing.invalidCharSet(new throwing.Context(context));  }

    // validacija unikatnosti option.code
    for (var i = 0; i < optionsArrValid.length; i++) {
        if (option.code == optionsArrValid[i].code) {            // pogleda, če ne obstaja že option z istim option.code
            context.wronger = option.code; throw throwing.notUnique(new throwing.Context(context));
        }
    }

    // TO DO !!! določi to število no
    // pogleda če ima opcija dodatne lastnosti
    if (Object.keys(option).length > 5) {
        context.wronger = option.code; throw throwing.invalidObject(new throwing.Context(context));
    }

    /* BRANJE CONSTRAINTSOV  */
    // TO DO !! - documentation
    if (option.constraints != "") {
        option.constraints = lm.readPropopostion(option.constraints);
    }

    return option;
}

/**
*   Validira text, preveri, če vsebuje
*   nedovoljene znake : ()
*/
function charSetValidator(text) {

    // TO DO!!

    return true;
}

/**
 *  Validira text, preveri, če vsebuje
 *  nedovoljene znake : ()
 */
function charSetValidatorOrderCode(text) {

    // TO DO !!

    return true;
}

/**
*   invalidDataException
*/
function invalidDataException(msg) {
    this.msg = msg;
    console.log(msg);

    // TO DO !!

    handleError(this);
}

module.exports = {
    parse : function (productTypeJSON) {
        // console.log(productTypeJSON);
        try {
            var productType = JSON.parse(productTypeJSON);  // pretvori JSON v objekt{}    
            var validData = validateProductType(productType);   // validira data
            return validData    
        } catch (error) {
            throwing.handleException(error);
            return error;
        }
    
    }
}



