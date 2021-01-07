const ReceiverService = require('../service/ReceiverService');

class IndexController {
    async index(req, res) {
        const filter = Object.fromEntries(
            Object.entries(req.query).filter(([key, value]) => {
                return (['band', 'type'].includes(key) && value != '');
            })
        );
        const receiverService = new ReceiverService();
        const receivers = await receiverService.getPublicReceivers(filter);
        res.render('index', { receivers, filter });
    }
    impressum(req, res) {
        res.render('impressum');
    }
}

module.exports = IndexController;