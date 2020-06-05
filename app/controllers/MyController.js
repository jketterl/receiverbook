const mongoose = require('mongoose');

class MyController {
    receivers(req, res) {
        const Receiver = mongoose.model('Receiver');
        Receiver.find({owner: req.user}).then((receivers) => {
            res.render('my/receivers', {receivers: receivers});
        });
    }
    newReceiver(req, res) {
        res.render('my/newReceiver');
    }
}

module.exports = MyController;