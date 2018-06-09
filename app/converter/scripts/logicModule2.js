var thisLocation = "Bralec omejitev"
var path = require('path');
var throwing = require(path.join(__dirname, '/exceptions.js'));

/**
*  Objekt, ki vsebuje vsa poimenovanja in RegEx stringe za branje in razrešitev logičnih propozicij
*  
*  
*  Naslednji znaki so lahko uporabljeni zgolj v skladu s svojo funkcijo:
*      functors: openingParenthesis, closingParenthesis, if, endif, then, and, or, not,
*      comparators : equals.chars, isBigger.chars, isSmaller.chars, isSameOrBigger.chars, isSameOrSmaller.chars
*      elementDelimeter, elementClosingParenthesis, elementOpeningParenthesis
*  Naslednji znaki ne smejo biti uporabljeni v inputu
*      conjunction, space, " (double quotes)
*    
*/
var logicNaming = {


    // logicni vezniki
    functors: {
        openingParenthesis: "(",
        closingParenthesis: ")",
        if: "if",
        endif: "endif",
        then: "then",
        and: "and",
        or: "or",
        not: "not",
        conjunction: "€",
    },
    // komparatorji
    comparators: {
        equals: {
            chars: [
                "=", /* ".", "==", */
            ],
            name: "equals"
        },
        notEquals: {
            chars: [
                "<>"
            ],
            name: "notEquals"
        },
        /*
        isBigger : {
            chars : [
                ">"
            ],
            name : "isBigger"
        },
        isSmaller : {
            chars : [
                "<"
            ],
            name : "isSmaller"
        },
        isSameOrBigger : {
            chars : [
                "=>", ">=" 
            ],
            name : "isSameOrBigger"
        }, 
        isSameOrSmaller : {
            chars : [
                "=<", "<="
            ],
            name : "isSameOrSmaller"
        }*/
    },


    space: "|",    // simbol, ki ga uporablja @readLogicalProposition, da razbije string na logične elemente
    elementDelimeter: "'",     // simbol, ki ga uporablja @parseNode, da prepozna variable
    elementOpeningParenthesis: "{",    // simbol, ki začenja array opcij v pogoju in v posledicah
    elementClosingParenthesis: "}",    // simbol, ki končuje array sklepov v pogoju in posldeicah
    propertyOpeningParenthesis: "[",
    propertyClosingParenthesis: "]",


    isFunctor: function (element) {      // vrne true, če je vnosni param = logicalNaming.functors
        for (var key in this.functors) {
            if (element == this.functors[key]) { return true; }
        }
        return false;
    },
    isComparator: function (element) {   // vrne ime komparatorja, če je vnosi param = comparator, sicer vrne null
        for (var key in this.comparators) {
            for (var i = 0; i < this.comparators[key].chars.length; i++) {
                if (element == this.comparators[key].chars[i]) {
                    return key;
                }
            }
        }
        return null;
    },
    isExpected: function (element) {
        var expectendTokens = [
            this.elementClosingParenthesis,
            this.elementOpeningParenthesis,
            this.propertyClosingParenthesis,
            this.propertyOpeningParenthesis,
            this.elementDelimeter,
            ",",
            ""
        ]
        for (var i = 0; i < expectendTokens.length; i++) {
            if (element == expectendTokens[i]) { return true; }
        }
        return false;
    }
}

/**
 *  Node je objekt, ki predstavlja spodnji list Proposition. 
 *  Vsebuje var Znacilnost, [opcije], in pa comparator ("=": (equals), <>: (notEquals) )
 *  @constructor 
 */
function Node(property, options, comparator) {
    this.property = property;
    this.options = options;
    this.comparator = comparator;
}

/**
 *  Proposition je objekt, ki vsebuje stmnt[], katere vsako polje je ali logični funktor (naming.functors),
 *  ali Node{} ali pa Proposition{} večje globine.
 *  Iz instance Proposition{} funkcija @getTruth() dobi resničnostno vrednost true/false 
 *  @constructor 
 */
function Proposition(stmnt) {
    var tmp = parseTree(stmnt);
    var propTmp = [];
    for (var i = 0; i < tmp.length; i++) {
        if (!Array.isArray(tmp[i])) {
            propTmp.push(tmp[i]);
        } else {
            propTmp.push(new Proposition(tmp[i]));
        }
    }
    this.stmnt = propTmp;
}

/**
 *  @description 
 *  @param -    propozicija v string obliki. Primer: "'znacilnost1'.[ '1', '5', '7',] and not ('znacilnost2'.'4')"
 *  @returns -  array, katerega vsako polje vsebuje ali logični functor ali pa node (npr. znacilnost1.4) 
 *              Primer:  ["(", Node, "and", "not", "(", Node, ")", ")"]
 */
function readPropopostion(string) {

    return readLogicalProposition(string);

    function readLogicalProposition(string) {

        // console.log(string);
        // doda oklepaje na začetek in na konec stringa (pomembno kasneje pri funkciji @parseTree)     
        var stmnt = logicNaming.functors.openingParenthesis + string + logicNaming.functors.closingParenthesis;

        // Loči na funkcijo na delimeterjih (upoštevajoč, da se "(" in ")" pišejo skupaj in narazen z drugim textom, npr. "if(x)" ali "if (x)" ) 
        var delimeters = [
            " ", logicNaming.functors.openingParenthesis, logicNaming.functors.closingParenthesis,
            logicNaming.propertyOpeningParenthesis, logicNaming.propertyClosingParenthesis,
        ];
        for (var i = 0; i < delimeters.length; i++) {
            stmnt = splitOnDelimeter(stmnt, delimeters[i]); // funkcija splita string na delimeterju, doda nov char, ki bo služil za nadaljnje delimitiranje, in zapiše originalni delimeter nazaj 
        }

        // odstrani nov delimeter (logicNaming.space) ib vrne stmnt kot array[]
        stmnt = stmnt.split(logicNaming.space);

        // odstrani "" elemente iz stmnt[]
        stmnt = removeSpaces(stmnt);

        // konjunkcijo zapisano z "if" () "then" () "endif", zamenja z "()€()" (pomembno kasneje pri funkciji @parseTree)
        stmnt = parseConjuction(stmnt);

        // skupaj sestavi sosednje ločene elemente stmnt[], ki niso logični funktorji
        stmnt = parseStrings(stmnt);

        // console.log(stmnt);

        return stmnt;
    }


    /**
     *  @description - Loči string po danem delimeterju in vpiše delimeter nazaj v string.
     */
    function splitOnDelimeter(stmnt, delimeter) {
        stmnt = stmnt.split(delimeter);
        for (var i = 1; i < stmnt.length; i++) {
            stmnt[i] = delimeter + logicNaming.space + stmnt[i];
        }
        return stmnt.join(logicNaming.space)
    }

    /**
     *  @description - odstrani polja, ki so ""
     */
    function removeSpaces(arr) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == "" || arr[i] == " ") {
                arr.splice(i, 1);
                i = i - 1;
            }
        }
        return arr;
    }

    /**
     *  @description - poskrbi za konjunkcijo
     */
    function parseConjuction(proposition) {
        // var newStmnt = [];
        for (var i = 0; i < proposition.length; i++) {
            // namesto "if" doda "("
            if (proposition[i] == logicNaming.functors.if) { proposition.splice(i, 1, logicNaming.functors.openingParenthesis); }
            // namesto "endif" doda ")"
            if (proposition[i] == logicNaming.functors.endif) { proposition.splice(i, 1, logicNaming.functors.closingParenthesis); }
            // namesto "then" doda )€( 
            if (proposition[i] == logicNaming.functors.then) {
                proposition.splice(i, 0, logicNaming.functors.closingParenthesis);
                proposition.splice(i + 1, 1, logicNaming.functors.conjunction);
                proposition.splice(i + 2, 0, logicNaming.functors.openingParenthesis);
            }
        }
        return proposition;
    }

    /**
     *  @description - združi sosednja polja stmnt[], ki niso logični funktorji in jih polje skozi @parseNode()
     */
    function parseStrings(stmnt) {

        // console.log(stmnt);
        var stringGroup = [];   // array, kamor se nalagajo sosednji nefunktorji
        var newStmnt = [];      // to be returned
        for (var i = 0; i < stmnt.length; i++) {
            if (!logicNaming.isFunctor(stmnt[i])) {   // kliče funkcijo premdeta logicNaming, ki vrne true, kolikor je smtnt[i] funktor
                stringGroup.push(stmnt[i]);         // če polje ni funktor, ga naloži v stringGroup[]
            }
            else {                                                   // če polje je funktor
                if (stringGroup.length != 0) {                            // če stringGroup ni prazen
                    // vsebino, ki ni funktor, pošlje čez funkcijo @parseNode(), ki vrne node 
                    // (Primer: "znacilnost1.4" postane { comparator: "equals", property: "znacilnost1", options: [ "4" ] }
                    // naloži kar je bilo v stringGroup v newStmnt[]
                    newStmnt.push(parseNode(stringGroup.join(" ")));
                }
                newStmnt.push(stmnt[i]);                            // naloži funktor v newStmnt[]
                stringGroup = [];
            }
            if (i == stmnt.length - 1) {                              // če gre za iteracijo čez zadnje polje stmnt[], naloži, kar je bilo v stringGroup v newStmnt[]
                if (stringGroup.length != 0) {
                    newStmnt.push(
                        parseNode(stringGroup.join(" ")) // vsebino, ki ni funktor pošlje čez @parseNode()    
                    );
                }
            }
        }
        return newStmnt; // vrne stmnt oblike: ["(", Node, "and", "not", "(", Node, ")", ")"]
    }

    function removeStartAndEndSpaces(stringN) {

        if (stringN === undefined) { context.wronger = stringN; throw throwing.invalidConstraint(new throwing.Context(context)); }

        // ODSTRANI MOREBITNE PRESLEDKE NA ZACETKU ALI KONCU PROPERTY IN OPTIONS STRINGA
        var startsWithSpace = true;
        var endsWithSpace = true;

        while (startsWithSpace && endsWithSpace) {

            if (stringN.charAt(0) == " ") {
                stringN = stringN.slice(1);
            } else { startsWithSpace = false; }
            if (stringN.charAt(stringN.length - 1) == " ") {
                stringN = stringN.slice(0, -1);
            } else { endsWithSpace = false; }

        }

        return stringN;
    }

    /**
     *  @description - 
     *  @param - dobi string, ki predstavlja node, npr. "znacilnost1"
     *  @returns - instanco objekta Node. (Primer: { comparator: "equals", property: "znacilnost1", options: [ "4" ] }) 
     */
    function parseNode(node) {

        console.log(node);
        // 1. Loči elemente in (property, options) od ostalih znakov
        var elements = [];

        // TO DO !! - drugac nared brat, da bo [] dovolj za Znacilnost in da bo 
        node = splitOnDelimeter(node, logicNaming.elementDelimeter);
        node = splitOnDelimeter(node, logicNaming.elementOpeningParenthesis);
        node = splitOnDelimeter(node, logicNaming.elementClosingParenthesis);
        node = splitOnDelimeter(node, logicNaming.propertyClosingParenthesis);
        node = splitOnDelimeter(node, logicNaming.propertyOpeningParenthesis);
        node = node.split(logicNaming.space);
        node = removeSpaces(node);

        var property = [];
        var options = [];

        // če je node[i] == "'", potem naloži vse med njim in naslednjim "'" v elements[]  
        var bool = false;
        for (var i = 0; i < node.length; i++) {

            if (bool) { options.push(node[i]); node.splice(i, 1) }

            if (node[i] == logicNaming.elementDelimeter) {
                bool = !bool;           // vklaplja in izklaplja bool
            }
        }

        // če bool ostane false, potem gre za nezaprt single quote - Exception
        if (bool) { throw new invalidComparatorException("Nezaprt singlequote"); }

        // če je node[i] == "[", potem naloži vse med njim in naslednjim "]" v property 
        var bool = false;
        for (var i = 0; i < node.length; i++) {

            if (bool) { property.push(node[i]); node.splice(i, 1) }

            // TO DO !! mogoce validacija za podvojen opening parenthesis ali closing parenthesis (sam sestej parenthesise) 
            if (node[i] == logicNaming.propertyOpeningParenthesis || node[i] == logicNaming.propertyClosingParenthesis) {
                bool = !bool;           // vklaplja in izklaplja bool
            }
        }

        if (property[0] === undefined) { context.wronger = property[0]; throw throwing.invalidConstraint(new throwing.Context(context)); }
        property[0] = removeStartAndEndSpaces(property[0]); // validacija ce je properties prevec TO DO !!
        for (var i = 0; i < options.length; i++) {
            if (options[i] === undefined) { context.wronger = options[i]; throw throwing.invalidConstraint(new throwing.Context(context)); }
            options[i] = removeStartAndEndSpaces(options[i]);
        }

        // TO DO !! - dokumentacija 

        node = node.join(" ");
        node = node.split(" ");
        node = removeSpaces(node);

        var comparator = [];
        var tmp;
        for (var i = 0; i < node.length; i++) {
            if (!logicNaming.isExpected(node[i])) {
                tmp = logicNaming.isComparator(node[i]);
                if (tmp != null) {
                    comparator.push(tmp);
                } else {
                    { context.wronger = node[i]; throw throwing.invalidCharSet(new throwing.Context(context)); }
                }

            }
        }

        // VALIDACIJA

        if (property == null) { throw new invalidComparatorException("Ni znacilnosti"); }
        if (options.length == 0) { throw new invalidComparatorException("Ni opcijske vrednosti"); } // če ni nobenih opcij
        if (comparator.length > 1) { throw new invalidComparatorException("Več komparatorjev"); }
        if (comparator == null) { throw new invalidComparatorException("Ni comparatorja"); } // če komparatorja ni se sproži izjema 
        /*if( (comparator == logicNaming.comparators.isBigger.name
            || comparator == logicNaming.comparators.isSmaller.name
            || comparator == logicNaming.comparators.isSameOrBigger.name
            || comparator == logicNaming.comparators.isSameOrSmaller.name)
            && options.length>1
        ){throw new invalidComparatorException("Preveč opcijskih vrednosti");}   // če je comparator "<, >" itd, in je več kot ena opcija Primer: 'znacilnost1'>['10', '3' ]
        */
        // če so podatki validirani je vrnjena instanca Node
        return new Node(property, options, comparator[0]);

    }

    /**
     *  @exception 
     */
    function invalidComparatorException(msg) {
        console.log(msg);
        fuckUp();
    }

}

/**
 *  @description
 *  @param stmnt -propozicija v array[] obliki, ki imav vsakem [polju] ali logični funktor ali instanco @Node
 *  @returns -  prešeteje oklepaje in določi globino segmetov propozicije. Vrne objekt instanco @Propostion globine (depth) 0,
 *              ki vsebuje logične funktorje, node, in pa druge instance @Proposition z globino > 0
 *              (Primer: ["(", Node, "or", Proposition, ")"]) 
 */
function parseTree(stmnt) {

    var proposition = [];       // sem se nalagajo vsi elementi depth = 1
    var subordinatedProposition = [];   // sem se nalagajo elementi depth > 1

    var depth = 0;      // depth se izračuna po formuli: depth = (sum(openingParenthesis) - sum(closingParenthesis))
    for (var i = 0; i < stmnt.length; i++) {

        if (stmnt[i] == logicNaming.functors.openingParenthesis) { depth += 1; }    // če je polje openingParenthesis prištej dept
        if (stmnt[i] == logicNaming.functors.closingParenthesis) { depth += -1; }   // če je polje closingParenthesis odštej dept   
        if (depth == 1) {     // funkcija loči zgolj globino 1 in >1. Vsaka naslednja globina se reši v constructorju @Proposition()
            // če se globina vrne na 1
            if (subordinatedProposition.length != 0) {      // in če je v subordinatedProposition[] že kak zapis

                if (stmnt[i] == logicNaming.functors.closingParenthesis) { subordinatedProposition.push(stmnt[i]); }    // če je stmnt[i] = ")", se depth sicer zniža na osnovni nivo, a ")" še vedno spada k subordinatedProposition
                proposition.push(subordinatedProposition);  // naloži celotno subordinirano propozicijo v proposition
                subordinatedProposition = [];   // izprazne tabelo

            }
            if (stmnt[i] != logicNaming.functors.closingParenthesis) { proposition.push(stmnt[i]); }  // 

        } else {
            subordinatedProposition.push(stmnt[i]);     // če je depth >1 nalgaj v subordinatedProposition[]
        }
        if (depth == 0) { proposition.push(stmnt[i]); }     // če je i zadnji element smtnt[]

    }

    // Validator
    if (depth != 0) { throw new invalidPropositionException("Depth is not 0"); }  // če globina po koncu ni 0 , potem gre za neveljavni logični stavek

    return proposition;
}

/**
 *  Za dano instanco @Proposition, vrne resnicnostno vrednost glede na uporabnikove izbire.
 *  @param proposition - instanca @Proposition 
 *  @param truths - uporabnikove izbire
 * 
 *  @returns - true/false 
 */
function getTruth(proposition, truths) {

    var stmnt = proposition.stmnt;

    for (var i = 0; i < stmnt.length; i++) {    // za vsak stmnt[i]

        if (stmnt[i] instanceof Node) {
            stmnt[i] = resolveNode(stmnt[i], truths);   // če je dano polje instanca Node() dobi vrednost true/false
        }


        if (stmnt[i] instanceof Proposition) {
            stmnt[i] = getTruth(stmnt[i]);      // če je dano polje instanca Proposition(), funkcija kliče samo sebe
        }


    }

    // vrstni red decidov uresniči prioriteto logičnih funktorjev not>and>or
    stmnt = decideNot(stmnt);   // 

    stmnt = decideAnd(stmnt);   // 

    stmnt = decideOr(stmnt);    // 

    for (var i = 0; i < stmnt.length; i++) {
        if (stmnt[i] == true) { return true; }  // tu je potreba po loopanju, kajti stmnt poleg "true"/"false" vsebuje "(" in ")"
    }

    return false;

    /**
     *  Za dani node 
     */
    function resolveNode(node, truths) {

        // TO DO !! test
        for (var i = 0; i < truths.length; i++) {
            if (node.property == truths[i].property) {
                // če se ujemata property v pogoju in property potem je treba ovrednotiti ta property
                var x = checkMatch(node.options, truths[i].option.value);

                if (node.comparator == logicNaming.comparators.equals.name)   // če je komparator "=" - equals
                { if (x) return true; }
                if (node.comparator == logicNaming.comparators.notEquals.name)   // če je komparator "<>" - notEquals
                { if (!x) return true; }
            }
        }

        return false;


    }

    function checkMatch(options, truth) {
        for (var i = 0; i < options.length; i++) {
            if (options[i] == truth) {
                return true;
            }
        }
        return false;
    }

    function decideNot(stmnt) {
        for (var i = 0; i < stmnt.length; i++) {
            if (stmnt[i] == logicNaming.functors.not) {

                stmnt[i + 1] = !stmnt[i + 1];
                stmnt.splice(i, 1);

            }
        }

        return stmnt;
    }

    function decideAnd(stmnt) {
        // console.log(stmnt);
        var newStmnt;
        while (stmnt != null) {
            newStmnt = stmnt;
            stmnt = getResultAnd(stmnt);

        }

        // console.log(newStmnt);
        return newStmnt;
    }

    function getResultAnd(stmnt) {
        for (var i = 0; i < stmnt.length; i++) {

            if (stmnt[i] == logicNaming.functors.and) {

                // switch
                var result = stmnt[i - 1] && stmnt[i + 1];

                var arr1 = chopArr(stmnt, 0, i - 2);

                var arr2 = chopArr(stmnt, i + 2, stmnt.length - 1);

                stmnt = arr1.push(result);
                stmnt = arr1.concat(arr2);

                return stmnt;
            }
        }

        return null;
    }

    function decideOr(stmnt) {
        // console.log(stmnt);
        var newStmnt;
        while (stmnt != null) {
            newStmnt = stmnt;
            stmnt = getResultOr(stmnt);

        }

        // console.log(newStmnt);
        return newStmnt;
    }

    function getResultOr(stmnt) {

        for (var i = 0; i < stmnt.length; i++) {

            if (stmnt[i] == logicNaming.functors.or) {

                // switch
                var result = stmnt[i - 1] || stmnt[i + 1];

                var arr1 = chopArr(stmnt, 0, i - 2);

                var arr2 = chopArr(stmnt, i + 2, stmnt.length - 1);

                stmnt = arr1.push(result);
                stmnt = arr1.concat(arr2);

                return stmnt;
            }
        }

        return null;
    }

    function chopArr(array, startIndex, endIndex) {
        var arr = [];
        for (var i = startIndex; i < endIndex + 1; i++) {
            arr.push(array[i]);
        }

        return arr;
    }

}

module.exports = {
    readPropopostion: function (stmnt) {

        stmnt = readPropopostion(stmnt);
        // console.log(stmnt);
        stmnt = new Proposition(stmnt);
        // console.log(stmnt);
        return stmnt;
    },
    getTruth: getTruth
}




