
const { ObjectProp, ObjectPull } = require('./structs');
const { floodPossibilityProp, floodPossibilityPull, floodDependence, floodImpossibility } = require('./possibility');
const { Retriever } = require('../util/retriever');
const { CrystalError, InternalError } = require('../util/error');

exports.ObjectData = class {

    constructor(template, obj) {

        let that = this;
        this.obj = obj;

        this.pullProxy = new Proxy(obj, {

            set(src, prop, val) {
                src[prop] = val;
                if (prop in that.props && !that.props[prop].exists) {
                    that.floodPossibilityProp(prop);
                }
                return true;
            },

            deleteProperty(src, prop) {
                delete src[prop];
                if (prop in that.props && that.props[prop].exists) {
                    that.floodImpossibility(prop);
                }
                return true;
            },

            has(src, prop) {
                if (prop in that.props) {
                    return that.props[prop].exists;
                } else return prop in src;
            }

        });

        this.template = template;

        this.defineProps();

        this.floodPossibilityProp = floodPossibilityProp;
        this.floodPossibilityPull = floodPossibilityPull;
        this.floodDependence = floodDependence;
        this.floodImpossibility = floodImpossibility;

        for (let propName in this.props) {
            if (propName in this.obj) {
                this.props[propName].exists = true;
                this.floodPossibilityProp(propName);
            }
        }

        if ('pull' in this.obj) throw new CrystalError(`'pull' is a reserved keyword, and cannot be used by a class.`);
        else this.obj.pull = function() { return that.pull(...arguments); };

    }

    defineProps(template) {

        this.pulls = [];
        for (let pullNo in this.template.pulls) {
            this.pulls[pullNo] = new ObjectPull();
        }

        this.props = {};
        for (let propName in this.template.props) {
            this.props[propName] = new ObjectProp();
        }

    }
    
    async pullOne(pullNo) {

        let funcs = this.template.pulls[pullNo].func;
        let FUNC_KEY = Symbol('FUNK_KEY');

        for (let f of funcs) {
            this.pullProxy[FUNC_KEY] = f;
            await this.pullProxy[FUNC_KEY]();
        }

        delete this.pullProxy[FUNC_KEY];

    }

    async pull(key) {

        let valueHandler = new Retriever();

        const getValue = async (propName) => {

            valueHandler.start(propName);

            let prop = this.props[propName];
            let pullNo = prop.parentOrder[0];
            if (pullNo === undefined) throw new InternalError(`Property '${propName}' was marked as possible but is not.`);
            let pull = this.template.pulls[pullNo];

            let promises = [];
            pull.parents.forEach(pName => {
                if (!this.props[pName].exists && !valueHandler.hasStarted(pName)) {
                    getValue(pName);
                    promises.push(valueHandler.waitFor(pName));
                }
            });

            await Promise.all(promises);

            await this.pullOne(pullNo);

            valueHandler.stop(propName, this.obj[propName]);

        }

        await getValue(key);

    }

}