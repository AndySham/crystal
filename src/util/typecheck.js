
const { CrystalError, InternalError } = require('./error');

exports.isArrowFunction = function(f) {
    let isntConstructor = true;
    try {
        new (new Proxy(f, {
            construct() { return {} }
        }));
        isntConstructor = false;
    } catch(e) {}
    return f instanceof Function && isntConstructor;
}

exports.makeSolidFunction = function(f) {
    // assuming it's a function already
    return exports.isArrowFunction(f) ? function() { let f_ = f; return f_(...arguments) } : f;
}

exports.isValidConstructor = function(f) {
    let isConstructor = false;
    try {
        new (new Proxy(f, {
            construct() { return {} }
        }));
        isConstructor = true;
    } catch(e) {}
    return f instanceof Function && isConstructor;
}

exports.isObjectLiteral = function(o) {
    return (o || 0).constructor === Object;
}

exports.isArrayLiteral = function(o) {
    return (o || 0).constructor === Array;
}


const extraTypes = new Set([
    Number, String, Boolean, Symbol, Function, undefined // undefined is the 'any' equivalent
]);
function isSimpleType(o) {
    return exports.isValidConstructor(o) || extraTypes.has(o);
}
exports.isValidType = function(o) {
    if (exports.isArrayLiteral(o)) {
        return o.length === 1 && isSimpleType(o[0]);
    }
    return isSimpleType(o);
}

function isOfSimpleType(o, type) {
    if (o === undefined || type === undefined) return true;
    else if (!exports.isValidType(type)) false;
    else {
        let isOfType = true;
        switch (type) {
            case Number: isOfType = typeof o === 'number'; break;
            case String: isOfType = typeof o === 'string'; break;
            case Boolean: isOfType = typeof o === 'boolean'; break;
            case Symbol: isOfType = typeof o === 'symbol'; break;
            default: isOfType = o instanceof type; break;
        }
        return isOfType;
    }
}
exports.isOfType = function(o, type) {
    if (exports.isArrayLiteral(type)) {
        if (type.length === 1) { // array of a certain type
            if (!(o instanceof Array)) return false;
            else {
                let isOfType = true;
                for (let i of o) {
                    let b = exports.isOfType(i, type[0]);
                    if (!b) {
                        isOfType = false;
                        break;
                    }
                }
                return isOfType;
            } 
        } else { // type "OR" operator
            let isOfType = false;
            for (let t of type) {
                let b = exports.isOfType(o, t);
                if (b) {
                    isOfType = true;
                    break;
                }
            }
            return isOfType;
        }
    } else {
        return isOfSimpleType(o, type);
    }
}
exports.verifyType = function(o, type, message) {
    if (!exports.isOfType(o,type)) {
        throw new CrystalError(message);
    } else return o;
}