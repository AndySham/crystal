
// this is a bit silly
exports.CrystalError = class CrystalError extends Error {
    constructor(str) {
        super();
        this.message = `[Crystal] ${str}`;
    }
}

exports.InternalError = class InternalError extends Error {
    constructor(str) {
        super();
        this.message = `[Crystal] Internal Error - ${/\.$/.test(str) ? str : str + '.'} Please Report!`;
    }
}