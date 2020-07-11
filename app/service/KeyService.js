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
        return responseHeader.split(',').filter(s => s.length > 0).map(snippet => {
            const responseMatches = /^([a-zA-Z]+)-([0-9a-f]{32})-([0-9a-f]{8})-([0-9a-f]{64})$/.exec(snippet);
            if (!responseMatches) {
                throw new KeyError("Invalid key response format");
            }
            return new KeyResponse(responseMatches[1], responseMatches[2], responseMatches[3], responseMatches[4]);
        })
    }
    generateChallenge(key) {
        const challengeString = crypto.randomBytes(16).toString('hex');
        return new KeyChallenge(key.source, key.id, challengeString);
    }
    getAuthorizationHeader(challenge) {
        return `ReceiverId ${challenge.toString()}`;
    }
    validateSignature(signature, time, challenge, key) {
        let timestamp;
        let timestamp_bytes;
        const useHexTimestamp = /[0-9a-z]{8}/.test(time)
        if (useHexTimestamp) {
            timestamp_bytes = Buffer.from(time, 'hex');
            timestamp = moment.unix(timestamp_bytes.readUIntBE(0, 4)).utc();
        } else {
            timestamp = moment.utc(time);
        }
        if (moment().diff(timestamp, 'minutes') > 5) {
            return false;
        }
        const hmac = crypto.createHmac('sha256', Buffer.from(key.secret, 'hex'))
            .update(Buffer.from(challenge.challenge, 'hex'));
        if (useHexTimestamp) {
            hmac.update(timestamp_bytes);
        } else {
            hmac.update(time, 'utf8');
        }
        return hmac.digest('hex') === signature;
    }
    generateSecret() {
        return crypto.randomBytes(32).toString('hex');
    }
}

module.exports = KeyService;