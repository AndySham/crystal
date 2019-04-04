
exports.Retriever = class {

    constructor() {

        this.values = new Map();
        this.waiters = new Map();
        this.started = new Set();

    }

    waitFor(key) {

        if (this.values.has(key)) return Promise.resolve(this.values.get(key));
        else {
            return new Promise((res, rej) => {
                if (this.waiters.has(key)) {
                    this.waiters.get(key).push(res);
                } else this.waiters.set(key, [res]);
            })
        }

    }   

    start(key) {

        this.started.add(key);

    }

    hasStarted(key) {

        return this.started.has(key);

    }

    stop(key, value) {

        if (!this.values.has(key)) {
            this.values.set(key, value);
            if (this.waiters.has(key)) this.waiters.get(key).forEach(x => x(value));
        }

    }

}