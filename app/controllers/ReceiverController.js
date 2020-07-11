const Receiver = require('../models/Receiver');
const ReceiverService = require('../service/ReceiverService');

class ReceiverController {
    newReceiver(req, res) {
        res.render('newReceiver', { claim: !!req.query.claim });
    }
    async processNewReceiver(req, res) {
        let receiverUrl;
        try {
            receiverUrl = new URL(req.body.url);
        } catch (e) {
            return res.render('newReceiver', {errors: ["Receiver URL could not be parsed."]})
        }
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
            return res.render('newReceiver', {errors: ["Receiver URL already exists in database."]})
        }

        const receiverService = new ReceiverService();
        const detectionResult = await receiverService.detectReceiverType(resolvedUrl.toString());

        if (!detectionResult) {
            return res.render('newReceiver', {errors: ["Unable to detect the receiver type"]})
        }

        const receiver = new Receiver({
            type: detectionResult.type,
            url: resolvedUrl.toString()
        });

        receiverService.applyCrawlingResult(receiver, detectionResult);

        if (req.body.claim && req.user) {
            receiver.claims = [{
                owner: req.user
            }];
        };

        await receiver.save()

        if (req.body.claim && req.user) {
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