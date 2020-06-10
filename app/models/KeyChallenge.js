class KeyChallenge {
    constructor(source, id, challenge) {
        this.source = source;
        this.id = id;
        this.challenge = challenge;
    }
    toString() {
        return `${this.source}-${this.id}-${this.challenge}`;
    }
}

module.exports = KeyChallenge;