const ReceiverService = require('../service/ReceiverService');

class IndexController {
    async index(req, res) {
        const receiverService = new ReceiverService();
        const receivers = await receiverService.getPublicReceivers();
        res.render('index', { receivers });
    }
    impressum(req, res) {
        res.render('impressum');
    }
}

module.exports = IndexController;