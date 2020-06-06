const mongoose = require('mongoose');
const config = require('../config');
require('./models');

module.exports.setup = async () => {
    const mongoUrl = new URL(config.mongo.url);
    mongoUrl.username = config.mongo.user;
    mongoUrl.password = config.mongo.password;
    await mongoose.connect(mongoUrl.toString(), { useNewUrlParser: true, useUnifiedTopology: true })
    return {
        mongoose: mongoose,
        mongoUrl: mongoUrl
    }
}