const Key = require('../models/Key');
const crypto = require('crypto');

class KeyService {
    generateKey() {
        const key = crypto.randomBytes(16).toString('hex');
        const secret = crypto.randomBytes(32).toString('hex');
        return new Key('receiverbook', key, secret);
    }
}

module.exports = KeyService;