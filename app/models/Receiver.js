const mongoose = require('mongoose');
const KeyService = require('../service/KeyService');

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

receiverSchema.methods.regenerateId = () => {
    this.key = generateId();
};

mongoose.model('Receiver', receiverSchema);
