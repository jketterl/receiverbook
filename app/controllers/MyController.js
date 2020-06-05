const mongoose = require('mongoose');

class MyController {
    receivers(req, res) {
        const Receiver = mongoose.model('Receiver');
        Receiver.find({owner: req.user}).then((receivers) => {
            res.render('my/receivers');
        })
    }
}

module.exports = MyController;