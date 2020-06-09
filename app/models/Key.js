class Key {
    constructor(source, id, secret) {
        this.source = source;
        this.id = id;
        this.secret = secret;
    }
    toString() {
        return `${this.source}-${this.id}-${this.secret}`
    }
}

module.exports = Key;