const { CrystalError } = require('../util/error');
const { isArrowFunction, verifyType } = require('../util/typecheck');

 exports.ClassProp = class {
    constructor(o, prop) {

        this.children = new Set();
        this.parents = new Set();

    }
}

exports.ClassPull = class {
    constructor(o, pullNo) {

        this.parents = verifyType(o.from, [String, [String]], `Pull #${pullNo} has invalid parameter 'from'. Must be a string, or an array of strings.`) || [];
        if (!(this.parents instanceof Array)) this.parents = new Set([this.parents]);
        else this.parents = new Set(this.parents);

        if (!('to' in o)) throw new CrystalError(`Pull #${pullNo} must have parameter 'to'.`);
        this.children = verifyType(o.to, [String, [String]], `Pull #${pullNo} has invalid parameter 'to', must be a string, or an array of strings.`);
        if (!(this.children instanceof Array)) this.children = new Set([this.children]);
        else this.children = new Set(this.children);

        if (!('func' in o)) throw new CrystalError(`Pull #${pullNo} must have parameter 'func'.`);
        this.func = verifyType(o.func, [Function, [Function]], `Pull #${pullNo} has invalid parameter 'to', must be a function, or an array of functions.`)
        if (!(this.func instanceof Array)) this.func = [this.func];
        this.func.forEach(x => {
            if (isArrowFunction(x)) throw new CrystalError(`To access the appropariate 'this' context, arrow functions cannot be used.`);
        }); 

        if ('name' in o) this.name = verifyType(o.name, [String, Symbol], `Pull #${pullNo} must have a name which is either a string or a symbol.`);

    }
}

exports.ObjectProp = class ObjectProp {
    constructor(value) {
        
        this.exists = false;
        this.possible = false;
        this.parentOrder = [];

        this.value = value;

    }
}

exports.ObjectPull = class ObjectPull {
    constructor(value) {

        this.possible = false;
        this.parentOrder = [];

    }
}