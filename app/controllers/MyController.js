const mongoose = require('mongoose');
const axios = require('axios');

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
    processNewReceiver(req, res) {
        const Receiver = mongoose.model('Receiver');
        const receiverUrl = new URL(req.body.url);
        // sanitize
        receiverUrl.hash = '';
        receiverUrl.search = '';

        const statusUrl = new URL(receiverUrl);
        if (!statusUrl.pathname.endsWith('/')) {
            statusUrl.pathname += '/';
        }
        statusUrl.pathname += 'status.json';

        axios.get(statusUrl.toString()).then((response) => {
            const receiver = new Receiver({
                label: response.data.receiver.name,
                url: receiverUrl.toString(),
                owner: req.user
            });
            receiver.save().then(() => {
                res.redirect('/my/receivers');
            })
        }).catch((error) => {
            console.error(error);
            res.render('my/newReceiver', {errors: ["Unable to contact the receiver. Please make sure your receiver is online and reachable from the Internet!"]})
        });
    }
}

module.exports = MyController;