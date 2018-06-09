var jQuery =  require('jquery');

var logicModule = function () {

    function getTruth(proposition, truths) {

        var propositionClone = JSON.parse(JSON.stringify(proposition));
        var stmnt = propositionClone.stmnt;

        for (var i = 0; i < stmnt.length; i++) {
            if (stmnt[i].hasOwnProperty('comparator')) {
                stmnt[i] = resolveNode(stmnt[i], truths);
            }
            if (stmnt[i].hasOwnProperty('stmnt')) {
                stmnt[i] = getTruth(stmnt[i], truths);
            }
        }

        stmnt = decide(stmnt, 'not');
        stmnt = decide(stmnt, 'and');
        stmnt = decide(stmnt, 'or');

        for (var i = 0; i < stmnt.length; i++) {
            if (stmnt[i] == true) { return true; }
        }
        return false;

        function resolveNode(node, truths) {
            for (var i = 0; i < truths.length; i++) {
                if (node.property == truths[i].property) {
                    var x = checkMatch(node.options, truths[i].option);
                    if (node.comparator === 'equals') { if (x) return true; }
                    if (node.comparator === 'notEquals') { if (!x) return true; }
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

        function decide(stmnt, functor) {
            if (functor === 'or' || functor === 'and') {
                var newStmnt;
                while (stmnt != null) {
                    newStmnt = stmnt;
                    stmnt = getResult(stmnt, functor);
                }
                return newStmnt;
            }
            if (functor === 'not') {
                for (var i = 0; i < stmnt.length; i++) {
                    if (stmnt[i] === 'not') {
                        stmnt[i + 1] = !stmnt[i + 1];
                        stmnt.splice(i, 1);
                    }
                }
                return stmnt;
            }
        }
        function getResult(stmnt, functor) {
            for (var i = 0; i < stmnt.length; i++) {
                if (stmnt[i] === functor) {
                    if (functor === 'and') { var result = stmnt[i - 1] && stmnt[i + 1]; }
                    if (functor === 'or') { var result = stmnt[i - 1] || stmnt[i + 1]; }
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

    return {
        getTruth: getTruth
    }
}



module.exports = logicModule;