
function isDefault(o) {
    return (o || 0).constructor === Object
}


export function getSchema(data) {

    const data_ = {};
    if (data instanceof Array) { // data: ['prop1', ...]
        for (let prop of data) {
            if (!typeof prop === "string") {
                throw `[Crystal] If data object is an array, each element must be a string. E.g.:\ndata: ['prop1', 'prop2', ...]`
            }
            data_[prop] = {
                type: undefined,
                primary: false,
                default: null,
                errorIfMissing: false,
                children: [],
                parents: []
            }
        }
    } else if (isDefault(data)) { // data: { ... }
        for (let [prop, value] of Object.entries(data)) { // prop: TypeConstructor
            if (prop instanceof Function) {
                data_[prop] = {
                    type: prop,
                    primary: false,
                    default: null,
                    errorIfMissing: false,
                    children: [],
                    parents: []
                }
            } else {
                if (isDefault(value)) { // prop: { ... }
                    data_[prop] = {
                        type: value.type || undefined,
                        primary: value.primary || false,
                        default: value.default || null,
                        errorIfMissing: value.errorIfMissing || false,
                        children: [],
                        parents: [],
                    }
                } else {
                    throw `[Crystal] Property data object must have default constructor. E.g.:\n${prop}: {\n    type: number\n}`
                }
            }
        }
    } else {
        throw `[Crystal] Data object must have default constructor. E.g.:\ndata: {\n    prop1: ... \n}`
    }

    return data_;

}

export function getPulls(pulls) {

    let pulls_ = [];
    if (pulls instanceof Array) {
        for (let pull in pulls) {
            if (isDefault(pulls[pull])) {
                let { from, func, to } = pulls[pull];

                if (from === undefined) from = [];
                else if (!(from instanceof Array)) from = [from]; 
                if (func === undefined) func = [];
                else if (!(func instanceof Array)) func = [func]; 
                if (to === undefined) to = [];
                else if (!(to instanceof Array)) to = [to]; 

                // if not all of from are strings
                if (!from.reduce((a,x) => a && typeof x === 'string', true)) { 
                    throw `[Crystal] pulls[${pull}].from must be a string, or an array of strings.`   
                }       
                // if not all of func are functions
                if (!func.reduce((a,x) => a && x instanceof Function, true)) { 
                    throw `[Crystal] pulls[${pull}].func must be a function, or an array of functions.`   
                }       
                // if not all of to are strings
                if (!to.reduce((a,x) => a && typeof x === 'string', true)) { 
                    throw `[Crystal] pulls[${pull}].to must be a string, or an array of strings.`
                }                   

                pulls_.push({ parents: new Set(from), func, children: new Set(to) });

            } else {
                throw `[Crystal] pulls[${pull}] must have default constructor. E.g.:\n pulls: [\n   ...\n   { ... },\n   ...\n]`
            }
        }
    } else {
        throw `[Crystal] Pulls must be an array. E.g.:\npulls = [{\n    from: 'prop1',\n    func: func1,\n    to: 'prop2'\n}, ...]`;
    }

    pulls_ = pulls_.filter(x => x.func.length > 0); // remove pulls with no functions

    return pulls_;

}