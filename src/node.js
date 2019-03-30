export class DataPoint {
    constructor(value) {
        this.exists = false;
        this.possible = false;
        this.parentOrder = [];
        if (arguments.length > 0) this.value = value;
    }
}

export class Scrape {
    constructor() {
        this.possible = false;
        this.parentOrder = [];
    }
}