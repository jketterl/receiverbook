const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
    label: String,
    owner: String
});

module.exports = mongoose.model('Station', stationSchema);