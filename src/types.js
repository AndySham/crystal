
export default function isOfType(element, type) {
    switch (type) {
        case Number: return typeof element === 'number';
        case String: return typeof element === 'string';
        case Boolean: return typeof element === 'boolean';
        case Symbol: return typeof element === 'symbol';
        case undefined: return element === undefined;
        case null: return element === null;
        default: return (type instanceof Object) && (element instanceof type);
    }
}