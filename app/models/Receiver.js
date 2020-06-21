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
    bands: [BandSchema],
    avatar_ctime: Date
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

receiverSchema.methods.regenerateKey = function(){
    this.key = generateKey.call(this, []);
    this.status = 'pending';
};

receiverSchema.methods.hasVersion = function(version){
    return semver.gte(semver.parse(this.version), semver.parse(version));
    return true;
};

mongoose.model('Receiver', receiverSchema);
