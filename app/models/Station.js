const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
    label: String,
    owner: String,
    receivers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Receiver'
    }]
});

module.exports = mongoose.model('Station', stationSchema);