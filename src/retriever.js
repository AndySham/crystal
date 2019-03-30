
export default class Retriever {

    constructor() {

        this.waiting = new Set();
        this.values = new Map();
        this.waiters = new Map();

    }

    setAsWaiting(key) {
        this.waiting.add(key);
    }

    isWaiting(key) {
        return this.waiting.has(key);
    }

    waitFor(key) {
        if (this.values.has(key)) 
            return Promise.resolve(this.values.get(key))
        else {
            return new Promise((res, rej) => {
                if (this.waiters.has(key)) {
                    this.waiters.get(key).push(res);
                } else {
                    this.waiters.set(key, [res]);
                }  
            });
        }
    }

    send(key, value) {
        this.values.set(key, value);
        let waiters = this.waiters.get(key) || [];
        for (let res of waiters) {
            res(value); 
        }
        this.waiters.delete(key);
    }

}