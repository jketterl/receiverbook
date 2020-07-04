const Key = require('../models/Key');
const KeyChallenge = require('../models/KeyChallenge');
const KeyResponse = require('../models/KeyResponse');
const crypto = require('crypto');
const moment = require('moment');

class KeyError extends Error {}

class KeyService {
    generateKey() {
        const key = crypto.randomBytes(16).toString('hex');
        const secret = this.generateSecret();
        return new Key('receiverbook', key, secret);
    }
    parse(keyString) {
        const matches = /^([a-zA-Z]+)-([0-9a-f]{32})-([0-9a-f]{64})$/.exec(keyString);
        if (!matches) throw new KeyError("invalid key format");
        return new Key(matches[1], matches[2], matches[3]);
    }
    parseResponse(responseHeader) {
        const headerMatches = /^Time=(.*), Response=(.*)$/.exec(responseHeader)
        if (!headerMatches) {
            throw new KeyError("Invalid header format");
        }
        const responseMatches = /^([a-zA-Z]+)-([0-9a-f]{32})-([0-9a-f]{64})$/.exec(headerMatches[2]);
        if (!responseMatches) {
            throw new KeyError("Invalid key response format");
        }
        return new KeyResponse(responseMatches[1], responseMatches[2], responseMatches[3], headerMatches[1]);
    }
    generateChallenge(key) {
        const challengeString = crypto.randomBytes(16).toString('hex');
        return new KeyChallenge(key.source, key.id, challengeString);
    }
    getAuthorizationHeader(challenge) {
        return `ReceiverId ${challenge.toString()}`;
    }
    validateHeader(header, challenge, key) {
        const response = this.parseResponse(header);
        return challenge.source === response.source &&
            challenge.id === response.id &&
            this.validateSignature(response.signature, response.time, challenge, key);
    }
    validateSignature(signature, time, challenge, key) {
        const timestamp = moment.utc(time);
        if (moment().diff(timestamp, 'minutes') > 5) {
            return false;
        }
        const hash = crypto.createHmac('sha256', Buffer.from(key.secret, 'hex'))
            .update(Buffer.from(challenge.challenge, 'hex'))
            .update(time, 'utf8')
            .digest('hex');
        return hash === signature;
    }
    generateSecret() {
        return crypto.randomBytes(32).toString('hex');
    }
}

module.exports = KeyService;