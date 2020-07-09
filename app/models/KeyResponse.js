class KeyResponse {
    constructor(source, id, time, signature) {
        this.source = source;
        this.id = id;
        this.time = time;
        this.signature = signature;
    }
}

module.exports = KeyResponse;