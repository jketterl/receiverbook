const mongoose = require('mongoose');

class IndexController {
    index(req, res) {
        const Receiver = mongoose.model('Receiver');
        Receiver.find().then((receivers) => {
            res.render('index', { receivers });
        })
    }
}

module.exports = IndexController;