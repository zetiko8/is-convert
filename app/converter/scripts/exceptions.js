var Exception = function(msg, context){
    console.log(context);
    this.msg = msg;
    this.context = context;
}

module.exports = {

    Context: function(param){
        this.location = param.location;
        this.entity = param.entity;
        this.iteration = param.iteration;
        this.wronger = param.wronger;
        this.thisId = param.thisId,
        this.higherLevel = param.higherLevel
    },
    // če je v csvju nadaljni lajn
    extraLineException : function(context){
        return new Exception('Znacilnost ni dolocena', context);
    },
    invalidCharSet : function(context){
        return new Exception('Napacni nabor znakov', context);
    },
    notUnique : function(context){
        return new Exception('Podvojeni element', context);
    },
    invalidObject : function(context){
        return new Exception('Neustrezna struktura', context);
    },
    missing : function(context){
        return new Exception('Manjkajoč element', context);
    },
    invalidConstraint : function(context){
        return new Exception('Neveljavna omejitev', context);
    },
    handleException : function(error){
        if(error.msg != null){
            console.log('\x1b[41m%s\x1b[0m', JSON.stringify(error.msg));
            if(error.context.iteration == null){
                console.log('\x1b[33m%s\x1b[0m', error.context);
            }else{
                console.log(error.context.location);
                console.log(error.context.entity + " " +error.context.iteration + "(" + error.context.higherLevel + ")");
                console.log(error.context.thisId);
                console.log(error.context.wronger);
            }
            
        }
        else{
            console.log(error);
        }
    }
}