const ReceiverService = require('../service/ReceiverService');
const FilterService = require('../service/FilterService');

class IndexController {
    async index(req, res) {
        const filterService = new FilterService();
        const receiverService = new ReceiverService();
        const filter = filterService.getFiltersFromRequest(req);
        const receivers = await receiverService.getPublicReceivers(filter);
        res.render('index', { receivers, filter });
    }
    impressum(req, res) {
        res.render('impressum');
    }
}

module.exports = IndexController;