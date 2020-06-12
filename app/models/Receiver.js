const mongoose = require('mongoose');
const KeyService = require('../service/KeyService');
const semver = require('semver')

function generateKey() {
    keyService = new KeyService();
    if (this.type === 'openwebrx') {
        return keyService.generateKey().toString();
    }
    if (this.type === 'websdr') {
        return keyService.generateSecret();
    }
}

const receiverSchema = new mongoose.Schema({
    label: String,
    type: String,
    version: String,
    url: String,
    owner: String,
    location: {
        type:{
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number]
        }
    },
    status: {
        type: String,
        enum: ['new', 'pending', 'online', 'offline'],
        default: 'new'
    },
    key: {
        type: String,
        default: generateKey
    }
});

receiverSchema.methods.regenerateKey = function(){
    this.key = generateKey.call(this, []);
    this.status = 'pending';
};

receiverSchema.methods.hasVersion = function(version){
    return semver.gte(semver.parse(this.version), semver.parse(version));
    return true;
};

mongoose.model('Receiver', receiverSchema);
