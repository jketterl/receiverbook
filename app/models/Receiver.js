const mongoose = require('mongoose');

const Receiver = mongoose.model('Receiver', {
    label: String,
    type: String,
    version: String,
    url: String,
    owner: String
});

module.exports = Receiver;