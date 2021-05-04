const mongoose = require('mongoose');
const KeyService = require('../service/KeyService');
const semver = require('semver');
const Station = require('./Station');

function generateKey() {
    keyService = new KeyService();
    const receiver = this.parent()
    if (receiver.type === 'openwebrx') {
        return keyService.generateKey().toString();
    }
    if (receiver.type === 'websdr') {
        return keyService.generateSecret();
    }
}

const BandSchema = new mongoose.Schema({
    name: String
}, {
    discriminatorKey: 'type',
    _id: false
});

BandSchema.methods.asRange = function() {
    switch (this.type) {
        case 'centered':
            const srh = this.sample_rate / 2;
            return {
                start: this.center_freq - srh,
                end: this.center_freq + srh
            };
        case 'range':
            return {
                start: this.start_freq,
                end: this.end_freq
            };
    }
};

const ClaimSchema = new mongoose.Schema({
    key: {
        type: String,
        default: generateKey
    },
    owner: {
        type: String,
        sparse: true
    },
    status: {
        type: String,
        enum: ['pending', 'verified'],
        default: 'pending',
        index: true,
    },
    lastVerified: Date,
});

ClaimSchema.methods.regenerateKey = function(){
    this.key = generateKey.call(this, []);
    this.status = 'pending';
};

const receiverSchema = new mongoose.Schema({
    label: String,
    type: String,
    version: String,
    url: {
        type: String,
        unique: true
    },
    claims: {
        type: [ClaimSchema],
        default: []
    },
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
        enum: ['online', 'offline'],
        default: 'offline',
        index: true,
    },
    statusReason: String,
    lastSeen: Date,
    bands: [BandSchema],
    avatar_ctime: Date,
    avatar_hash: String,
    station: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station',
        sparse: true
    }
});

const docArray = receiverSchema.path('bands');

const RangeSchema = new mongoose.Schema({
    start_freq: Number,
    end_freq: Number
}, {
    _id: false
});

docArray.discriminator('range', RangeSchema);

const CenteredSchema = new mongoose.Schema({
   center_freq: Number,
   sample_rate: Number
}, {
   _id: false
});

docArray.discriminator('centered', CenteredSchema);

receiverSchema.methods.hasVersion = function(version){
    return semver.gte(semver.parse(this.version), semver.parse(version));
    return true;
};

module.exports = mongoose.model('Receiver', receiverSchema);
