
const Template = require('./obj/template');

exports.extend = function(c, pulls) {

    const template = new Template(pulls);

    return new Proxy(c, {
        construct(c_, args) {
            let r = new c_(...args);

            let objectData = template.objectData(r);

            return new Proxy(r, {
                set(src, prop, val) {
                    src[prop] = val;
                    if (prop in template.props) {
                        objectData.floodPossibilityProp(prop);
                    }
                    return true;
                },

                deleteProperty(src, prop) {
                    delete src[prop];
                    if (prop in template.props) {
                        objectData.floodImpossibilityProp(prop);
                    }
                    return true;
                },

                has(src, prop) {
                    if (prop in template.props) {
                        return objectData.props[prop].exists;
                    } else return prop in src;
                }
            });
        }
    })

}