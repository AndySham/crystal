
const { ObjectProp, ObjectPull } = require('./structs');
const { InternalError } = require('../util/error');

exports.floodPossibilityProp = function (propName) {

    // for all children
    for (let childPullNo of this.template.props[propName].children) {
        let childPull = this.pulls[childPullNo];
        // (X,Y) !∈ P if here, as dataName was just made possible
        childPull.parentOrder.push(propName);
        if (childPull.parentOrder.length    
            === this.template.pulls[childPullNo].parents.size) {
                // X ⊆ P
                childPull.possible = true;
                this.floodPossibilityPull(childPullNo);
            }
    }

}

exports.floodPossibilityPull = function (pullNo) {

    // for all children
    for (let childPropName of this.template.pulls[pullNo].children) {
        let childProp = this.props[childPropName];

        childProp.parentOrder.push(pullNo);
        if (!childProp.possible) {
            childProp.possible = true;
            this.floodPossibilityProp(childPropName);
        }
    }

}

exports.floodDependence = function (propName) {

    const dependents = new Set();
    const dependentParentPulls = new Map();
    // prop -> number of parent pulls which are dependents

    const prop = (propName) => {

        for (let childPullNo of this.template.props[propName].children) {
            let childPull = this.pulls[childPullNo];
            if (childPull.possible && !dependents.has(childPull)) {
                dependents.add(childPull);
                pull(childPullNo);
            }
        }

    }

    const pull = (pullNo) => {

        for (let childPropName of this.template.pulls[pullNo].children) {
            let childProp = this.props[childPropName];

            let childPropData = dependentParentPulls.get(childProp); // for some reason this cant be in the line below
            dependentParentPulls.set(childProp, ++childPropData || 1);
            // add 1 if existant, set to 1 if not

            // ∈ (P \ C) ∪ {a}
            if ((childPropName === propName || (childProp.possible && !childProp.exists)) 
                && !dependents.has(childProp) // !∈ D_a
                && dependentParentPulls.get(childProp) // parents ⊆ D_a
                    !== this.template.props[childPropName].parents.size) {
                
                dependents.add(childProp);
                prop(childPropName);

            }
        }

    }

    prop(propName);

    return dependents.has(this.props[propName] ? dependents : new Set());

}

exports.floodImpossibility = function (propName) {
    
    let dependents = this.floodDependence(propName);

    for (let node of dependents) {

        node.possible = false;
        if (node instanceof ObjectProp) {
            node.parentOrder = node.parentOrder.filter(
                pullNo => !dependents.has(this.pulls[pullNo])
            );
        } else if (node instanceof ObjectPull) {
            node.parentOrder = node.parentOrder.filter(
                propName => !dependents.has(this.props[propName])
            );
        } else {
            throw new InternalError(`An object was identified as a dependent of '${propName}' while not being of the appropriate class.`)
        }

    }

}
