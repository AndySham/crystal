import { getSchema, getPulls } from './data';
import { DataPoint, Scrape } from './node';
import Retriever from './retriever';

/*
{
    data: ['prop1','prop2'] || {
        prop1: TypeConstructor,
        prop2: {
            type: TypeConstructor,
            primary: true/false,
            default: DefaultOfTypeTypeConstructor,
            errorIfMissing: true/false,
        }
    },
    pulls: [ // req: required properties, func: functions to run to get data 
        { req: 'prop1', func: functionName, ret: 'prop2'  },
        { req: ['prop1', 'prop2'], func: functionName, ret: ['prop3', 'prop4'] },
        { req: 'prop1', func: [func1, func2], ret: 'prop2' },
    ],
}
*/

const objKeywords = new Set([
    'pull',
]);

export default function Struct({ schema: schema_ = {}, pulls: pulls_ = [], pushes: pushes_ = [], primary }) {

    let schema = getSchema(schema_);
    let scrapes = getPulls(pulls_);

    // scrapes already know parents and children, but data points do not
    for (let scrapeNo in scrapes) {
        
        for (let data of scrapes[scrapeNo].parents) {
            let d = schema[data];
            if (d === undefined) throw `[Crystal] Pull #${scrapeNo} has invalid field requirements - ${data} is not in schema.`
            else {
                d.children.push(scrapeNo);
            }
        }

        for (let data of scrapes[scrapeNo].children) {
            let d = schema[data];
            if (d === undefined) throw `[Crystal] Pull #${scrapeNo} returns invalid field - ${data} is not in schema.`
            else {
                d.parents.push(scrapeNo);
            }
        }

    }


    let floodPossibilityData = function (obj, dataName) {

        // for all children
        for (let childScrapeNo of schema[dataName].children) {
            let childScrape = obj.scrapes[childScrapeNo];
            // (X,Y) !∈ P if here, as dataName was just made possible
            childScrape.parentOrder.push(dataName);
            if (childScrape.parentOrder.length
                === scrapes[childScrapeNo].parents.size) {
                    // X ⊆ P
                    childScrape.possible = true;
                    floodPossibilityScrape(obj, childScrapeNo)
                }
        }

    }

    let floodPossibilityScrape = function (obj, scrapeNo) {

        // for all children
        for (let childDataName of scrapes[scrapeNo].children) {
            let childData = obj.data[childDataName];

            childData.parentOrder.push(scrapeNo);
            if (!childData.possible) {
                childData.possible = true;
                floodPossibilityData(obj, childDataName);
            }
        }

    }

    let floodDependence = function (obj, dataName) {

        let dependents = new Set();
        let dependentParentScrapes = new Map();
        // data node -> number of parent scrapes which are dependents

        let data = function(dataName) {

            for (let childScrapeNo of schema[dataName].children) {
                let childScrape = obj.scrapes[childScrapeNo];
                if (childScrape.possible && !dependents.has(childScrape)) {
                    dependents.add(childScrape);
                    scrape(childScrapeNo);
                }
            }

        }

        let scrape = function(scrapeNo) {

            for (let childDataName of scrapes[scrapeNo].children) {
                let childData = obj.data[childDataName];

                let getChildData = dependentParentScrapes.get(childData); // for some reason this cant be in the line below
                dependentParentScrapes.set(childData, ++getChildData || 1);
                // add one if existant, set to one if not

                // ∈ (P \ C) ∪ {a}
                if ((childDataName === dataName || (childData.possible && !childData.exists))
                    && !dependents.has(childData) // !∈ D_a
                    && dependentParentScrapes.get(childData) // parents ⊆ D_a
                        !== schema[childDataName].parents.length) {

                    dependents.add(childData);
                    data(childDataName);

                }
            }

        }

        data(dataName);

        return dependents.has(obj.data[dataName]) ? dependents : new Set();

    }

    let floodImpossibility = function(obj, dataName) {
        let dependents = floodDependence(obj, dataName);
        for (let node of dependents[Symbol.iterator]) {
            node.possible = false;
            if (node instanceof DataPoint) {
                node.parentOrder = node.parentOrder.filter(scrapeNo => 
                                        dependents.has(obj.scrapes[scrapeNo]) );
            } else if (node instanceof Scrape) {
                node.parentOrder = node.parentOrder.filter(dataName => 
                                        dependents.has(obj.data[dataName]) );
            } else {
                throw `[Crystal] Fatal Error - An object was identified as a dependent of '${dataName}' while not being of the appropriate class. Please report!`
            }
        }
    }

    let getValue = function(obj, prop) {

        if (obj.data[prop].exists) return new Promise.resolve(obj.data[prop].value)

        let values = new Retriever();

        let getData = async function(prop) {

            if (values.isWaiting(prop)) return;
            values.setAsWaiting(prop);

            let scrapeNo = obj.data[prop].parentOrder[0];
            if (scrapeNo === undefined) throw `[Crystal] Fatal Error - Property '${prop}' was marked as possible when it isn't. Please report!`
            else {
                let scrape = scrapes[scrapeNo];
                let promises = [];
                scrape.parents.forEach(x => {
                    if (!obj.data[x].exists) {
                        getData(x);
                        promises.push(values.waitFor(x));
                    }
                });
                await Promise.all(promises);

                //console.log(`state at '${prop}':`, Object.entries(obj.data).map(([key, val]) => [key, val.value]));//obj.data.map(x => x.value));

                let sym = Symbol(); // user cant access this property

                let objProxy = new Proxy(obj, {
            
                    get(obj, prop) {
                        if (prop === sym) return obj[prop];
                        let o = obj.data[prop];
                        return o !== undefined && o.exists ? o.value : undefined;   
                    },
        
                    set(obj, prop, value) {
                        if (prop === sym) {
                            obj[prop] = value;
                        } else if (!scrape.children.has(prop)) {
                            throw `[Crystal] Pull #${scrapeNo} should not edit field '${prop.toString()}', yet it does.`;
                        } else {
                            obj.data[prop].value = value; // thank god
                        }
                        return true;
                    },

                    deleteProperty(obj, prop) {
                        if (prop !== sym) {
                            throw `[Crystal] Field '${prop}' cannot be deleted in this function.`
                        } else delete obj[prop];
                    }
        
                });

                for (let f of scrape.func) {

                    // let user errors bubble up to user logic
                    objProxy[sym] = f; // appropriate 'this' context
                    let p = objProxy[sym](); 
                    if (p instanceof Promise) await p;

                }

                delete obj[sym];
                obj.data[prop].exists = true;
                values.send(prop, obj.data[prop]);
            }

        }

        return new Promise((res, rej) => {
            getData(prop);
            values.waitFor(prop).then(val => res(val.value));
            //res(obj.data[prop].value);
        });
    }

    let class_ = function(o) {

        this.data = {};

        this.scrapes = [];
        for (let key in scrapes) {
            this.scrapes[key] = new Scrape(); 
        }

        let existant = new Set();

        // we define all data points as properties
        for (let [key, value] of Object.entries(schema)) {
            //console.log(key, o[key], o);
            if (o[key] !== undefined) {
                this.data[key] = new DataPoint(o[key]);
                this.data[key].exists = this.data[key].possible = true;
                //floodPossibilityData(this, key);
                existant.add(key);
            } else if (schema[key].default !== undefined) {
                this.data[key] = new DataPoint(schema[key].default);
            } else if (schema[key].errorIfMissing) {
                throw `[Crystal] Missing field '${key}'.`;
            } else {
                this.data[key] = new DataPoint();
            }
        }

        for (let node of existant) {
            floodPossibilityData(this, node);
        }

    };

    class_.schema = schema;
    class_.scrapes = scrapes;

    //class_.floodPossibilityData = floodPossibilityData;
    //class_.floodPossibilityScrape = floodPossibilityScrape;
    //class_.floodDependence = floodDependence;
    //class_.floodImpossibility = floodImpossibility;
    class_.getValue = getValue;

    return new Proxy(class_, {
        construct(obj, o) {

            let r = new obj(o[0]);
            return new Proxy(r, {
                
                get(obj, prop) {
                    let dP = obj.data[prop];
                    if (dP === undefined) return Promise.resolve(undefined);
                    else {
                        if (dP.exists) return Promise.resolve(dP.value);
                        else if (dP.possible) return class_.getValue(obj, prop);
                        else throw `[Crystal] Field '${prop}' cannot be determined with current information.`
                    }
                },

                set(obj, prop, value) {
                    
                },

                has(obj, key) {
                    return obj.data[key] !== undefined && obj.data[key].exists;
                },

                deleteProperty(obj, prop) {
                    if (obj.data[prop] !== undefined) {
                        obj.data[prop].exists = false;
                        // maybe set back to default value?
                        floodImpossibility(obj, prop);
                    }
                },

                defineProperty(obj, prop, value) {
                    // same as set
                },

                ownkeys(obj) {
                    return Object.keys(obj.data).filter(key => obj.data[key].exists);
                },

                isExtensible(obj) {
                    return false;
                },

            })

        }
    })

}