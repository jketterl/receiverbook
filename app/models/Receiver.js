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

const BandSchema = new mongoose.Schema({
    name: String
}, {
    discriminatorKey: 'type',
    _id: false
});

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
    },
    bands: [BandSchema]
});

const docArray = receiverSchema.path('bands');

const RangeSchema = docArray.discriminator('range', new mongoose.Schema({
    start_freq: Number,
    end_freq: Number
}, {
    _id: false
}));

const CenteredSchema = docArray.discriminator('centered', new mongoose.Schema({
    center_freq: Number,
    sample_rate: Number
}, {
    _id: false
}));

receiverSchema.methods.regenerateKey = function(){
    this.key = generateKey.call(this, []);
    this.status = 'pending';
};

receiverSchema.methods.hasVersion = function(version){
    return semver.gte(semver.parse(this.version), semver.parse(version));
    return true;
};

receiverSchema.methods.getPresentationType = function () {
    switch (this.type) {
        case 'openwebrx':
            return 'OpenWebRX';
        case 'websdr':
            return 'WebSDR';
        case 'kiwisdr':
            return 'KiwiSDR';
    }
    return 'Other';
}


mongoose.model('Receiver', receiverSchema);
