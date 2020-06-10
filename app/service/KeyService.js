const Key = require('../models/Key');
const KeyChallenge = require('../models/KeyChallenge');
const crypto = require('crypto');
const moment = require('moment');

class KeyError extends Error {}

class KeyService {
    generateKey() {
        const key = crypto.randomBytes(16).toString('hex');
        const secret = crypto.randomBytes(32).toString('hex');
        return new Key('receiverbook', key, secret);
    }
    parse(keyString) {
        const matches = /^([a-zA-Z]+)-([0-9a-f]{32})-([0-9a-f]{64})$/.exec(keyString);
        if (!matches) throw new KeyError("invalid key format");
        return new Key(matches[1], matches[2], matches[3]);
    }
    generateChallenge(key) {
        const challengeString = crypto.randomBytes(16).toString('hex');
        return new KeyChallenge(key.source, key.id, challengeString);
    }
    getAuthorizationHeader(challenge) {
        return `ReceiverId ${challenge.toString()}`;
    }
    validateSignature(signature, challenge, key) {
        const timestamp = moment.utc(signature.time);
        if (moment().diff(timestamp, 'minutes') > 5) {
            return false;
        }
        const signatureString = `${challenge.challenge}:${signature.time}`
        const hash = crypto.createHash('sha256')
            .update(signatureString)
            .digest('hex');
        return hash === signature.signature;
    }
}

module.exports = KeyService;