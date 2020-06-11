const mongoose = require('mongoose');

class IndexController {
    index(req, res) {
        const Receiver = mongoose.model('Receiver');
        Receiver.find({status: 'online'}).then((receivers) => {
            res.render('index', { receivers });
        })
    }
    impressum(req, res) {
        res.render('impressum');
    }
}

module.exports = IndexController;