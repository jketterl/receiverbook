class KeyResponse {
    constructor(source, id, signature, time) {
        this.source = source;
        this.id = id;
        this.signature = signature;
        this.time = time;
    }
}

module.exports = KeyResponse;