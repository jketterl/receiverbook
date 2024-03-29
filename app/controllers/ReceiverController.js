const Receiver = require('../models/Receiver');
const ReceiverService = require('../service/ReceiverService');
const axios = require('axios');
const config = require('../../config');

class ReceiverController {
    newReceiver(req, res) {
        res.render('newReceiver', { claim: !!req.query.claim });
    }
    async processNewReceiver(req, res) {
        const claim = req.body.claim && req.user;
        let receiverUrl;
        try {
            receiverUrl = new URL(req.body.url);
        } catch (e) {
            return res.render('newReceiver', {errors: ["Receiver URL could not be parsed."], claim, url: req.body.url})
        }

        if (!['http:', 'https:'].includes(receiverUrl.protocol)) {
            return res.render('newReceiver', {errors: ["Receiver URL protocol not supported."], claim, url: req.body.url})
        }

        // sanitize
        receiverUrl.hash = '';
        receiverUrl.search = '';

        // follow any redirects
        let resolvedUrl;
        try {
            const response = await axios.get(receiverUrl.toString(), {headers: {'User-Agent': config.userAgent}})
            resolvedUrl = new URL(response.request.res.responseUrl);
        } catch (error) {
            //console.error(error)
            //return res.render('my/newReceiver', {errors: ["Unable to contact the receiver. Please make sure your receiver is online and reachable from the Internet!"]})
            // ignore this error since kiwisdr websdr webservers send back invalid responses
            resolvedUrl = receiverUrl;
        }

        // OpenWebRX classic wants us to upgrade our browser. Little hack to omit that part...
        resolvedUrl.pathname = resolvedUrl.pathname.replace(/upgrade.html$/, '');

        const existing = await Receiver.findOne({ url: resolvedUrl.toString() })
        if (existing) {
            if (claim) {
                return res.redirect(`/my/receivers/${existing.id}/claim`);
            }
            let error = "Receiver URL already exists in database. ";
            if (req.user) {
                error += "Would you like to claim that receiver?"
            } else {
                error += "Please register or log in to be able to claim that receiver."
            }
            return res.render('newReceiver', {errors: [error], claim, url: receiverUrl})
        }

        const receiverService = new ReceiverService();
        let detectionResult;
        try {
            detectionResult = await receiverService.detectReceiverType(resolvedUrl.toString());
        } catch (error) {
            console.error(error.stack);
            return res.render('newReceiver', {errors: [error.message || 'unknown error'], claim, url: receiverUrl})
        }

        if (detectionResult.status != 'fulfilled') {
            return res.render('newReceiver', {errors: detectionResult.errors, claim, url: receiverUrl})
        }

        const receiver = new Receiver({
            type: detectionResult.value.type,
            url: resolvedUrl.toString()
        });

        receiverService.applyCrawlingResult(receiver, detectionResult.value);

        if (claim) {
            receiver.claims = [{
                owner: req.user
            }];
        };

        await receiver.save()

        if (claim) {
            res.redirect(`/my/receivers/${receiver.id}`);
        } else {
            res.redirect(`/receivers/addedsuccessfully`);
        }
    }
    addedSuccessfully(req, res) {
        res.render('addedSuccessfully');
    }
}

module.exports = ReceiverController;