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
            //console.error(error)
            //return res.render('my/newReceiver', {errors: ["Unable to contact the receiver. Please make sure your receiver is online and reachable from the Internet!"]})
            // ignore this error since kiwisdr websdr webservers send back invalid responses
            resolvedUrl = receiverUrl;
        }

        // OpenWebRX classic wants us to upgrade our browser. Little hack to omit that part...
        resolvedUrl.pathname = resolvedUrl.pathname.replace(/upgrade.html$/, '');

        const existing = await Receiver.find({ url: resolvedUrl.toString() })
        if (existing.length) {
            return res.render('my/newReceiver', {errors: ["Receiver URL already exists in database."]})
        }

        const receiverService = new ReceiverService();
        const detectionResult = await receiverService.detectReceiverType(resolvedUrl.toString());

        if (!detectionResult) {
            return res.render('my/newReceiver', {errors: ["Unable to detect the receiver type"]})
        }

        const receiver = new Receiver({
            type: detectionResult.type,
            url: resolvedUrl.toString(),
            owner: req.user,
        });
        receiverService.applyCrawlingResult(receiver, detectionResult);
        await receiver.save()
        res.redirect(`/my/receivers/${receiver.id}`);
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
    async regenerateKey(req, res) {
        const Receiver = mongoose.model('Receiver');
        const receiver = await Receiver.findOne({owner: req.user, _id: req.params.id});
        if (!receiver) return res.status(404).send("receiver not found");
        receiver.regenerateKey();
        await receiver.save();
        res.redirect(`/my/receivers/${receiver.id}`);
    }
}

module.exports = MyController;