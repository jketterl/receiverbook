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
    async processNewReceiver(req, res) {
        const Receiver = mongoose.model('Receiver');
        const receiverUrl = new URL(req.body.url);
        // sanitize
        receiverUrl.hash = '';
        receiverUrl.search = '';

        // follow any redirects
        let resolvedUrl;
        try {
            const response = await axios.get(receiverUrl.toString())
            resolvedUrl = new URL(response.request.res.responseUrl);
        } catch (error) {
            return res.render('my/newReceiver', {errors: ["Unable to contact the receiver. Please make sure your receiver is online and reachable from the Internet!"]})
        }

        const existing = await Receiver.find({ url: resolvedUrl.toString() })
        if (existing.length) {
            return res.render('my/newReceiver', {errors: ["Receiver URL already exists in database."]})
        }

        const statusUrl = new URL(resolvedUrl);
        if (!statusUrl.pathname.endsWith('/')) {
            statusUrl.pathname += '/';
        }
        statusUrl.pathname += 'status.json';

        let statusResponse;
        try {
            statusResponse = await axios.get(statusUrl.toString())
        } catch (error) {
            console.error(error);
            return res.render('my/newReceiver', {errors: ["Unable to get the receiver status. Please make sure your receiver is online and reachable from the Internet!"]})
        }

        const receiver = new Receiver({
            label: statusResponse.data.receiver.name,
            url: resolvedUrl.toString(),
            owner: req.user
        });
        await receiver.save()
        res.redirect('/my/receivers');

    }
    editReceiver(req, res) {
        const Receiver = mongoose.model('Receiver');
        Receiver.findOne({owner: req.user, _id: req.params.id}).then((receiver) => {
            if (!receiver) return res.status(404).send('receiver not found');
            res.render('my/editReceiver', { receiver });
        });
    }
    deleteReceiver(req, res) {
        const Receiver = mongoose.model('Receiver');
        Receiver.deleteOne({owner: req.user, _id: req.params.id}).then(() => {
            res.redirect('/my/receivers');
        });
    }
}

module.exports = MyController;