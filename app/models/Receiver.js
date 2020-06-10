const mongoose = require('mongoose');
const KeyService = require('../service/KeyService');
const semver = require('semver')

function generateKey() {
    keyService = new KeyService();
    return keyService.generateKey().toString();
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
        default: generateKey,
        required: true
    }
});

receiverSchema.methods.regenerateKey = function(){
    this.key = generateKey();
};

receiverSchema.methods.hasVersion = function(version){
    return semver.gte(semver.parse(this.version), semver.parse(version));
    return true;
};

mongoose.model('Receiver', receiverSchema);
