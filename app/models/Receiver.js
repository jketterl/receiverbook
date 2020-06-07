const mongoose = require('mongoose');

const Receiver = mongoose.model('Receiver', {
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
    }
});

module.exports = Receiver;