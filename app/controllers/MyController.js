const mongoose = require('mongoose');
const axios = require('axios');
const ReceiverService = require('../service/ReceiverService');

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

        const receiverService = new ReceiverService();
        const detectionResult = await receiverService.detectReceiverType(resolvedUrl.toString());

        if (!detectionResult.openwebrx) {
            return res.render('my/newReceiver', {errors: ["Could not detect an OpenWebRX receiver at the given URL. Other receiver types will be supported soon!"]})
        }

        const receiver = new Receiver({
            label: detectionResult.openwebrx.name,
            type: 'openwebrx',
            version: detectionResult.openwebrx.version,
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