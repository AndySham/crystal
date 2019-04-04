
const { ClassProp, ClassPull } = require('./structs');
const { isArrayLiteral, isObjectLiteral } = require('../util/typecheck');
const { ObjectData } = require('./objectdata')

function cleanInput(pulls) {

    let cleanPulls = [];
    let cleanSchema = {};
    let pullsByName = {};

    if (isArrayLiteral(pulls)) {
        for (let pullNo in pulls) {
            if (isObjectLiteral(pulls[pullNo])) {
                
                let pull = new ClassPull(pulls[pullNo], pullNo);
                if (pull.func.length === 0) break;
                cleanPulls[pullNo] = pull;

                for (let s of pull.parents) {
                    if (s in cleanSchema) {
                        cleanSchema[s].children.add(pullNo);
                    } else {
                        cleanSchema[s] = new ClassProp();
                        cleanSchema[s].children.add(pullNo);
                    }
                } 

                for (let s of pull.children) {
                    if (s in cleanSchema) {
                        cleanSchema[s].parents.add(pullNo);
                    } else {
                        cleanSchema[s] = new ClassProp();
                        cleanSchema[s].parents.add(pullNo);
                    }
                }

                if ('name' in pull) pullsByName[pull[name]] = pullNo;

            } else {
                throw new CrystalError(`Pull #${pullNo} must be an object literal.`)
            }
        }
    } else {
        throw new CrystalError(`Pulls must be an array.`)
    }

    return { pulls: cleanPulls, props: cleanSchema, pullsByName: pullsByName };

}

module.exports = class Template {

    constructor(pulls) {

        let { pulls: pulls_, props, pullsByName } = cleanInput(pulls);
        this.pulls = pulls_;
        this.props = props;
        this.pullsByName = pullsByName;

    }

    objectData(obj) {

        return new ObjectData(this, obj);

    }

}