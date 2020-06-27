const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
    label: String,
    owner: {
        type: String,
        index: true
    }
});

module.exports = mongoose.model('Station', stationSchema);