const ReceiverService = require('../service/ReceiverService');
const FilterService = require('../service/FilterService');

const querystring = require('querystring');

const entriesPerPage = 25;

class IndexController {
    async index(req, res) {
        const filterService = new FilterService();
        const receiverService = new ReceiverService();
        const filter = filterService.getFiltersFromRequest(req);
        const allReceivers = await receiverService.getPublicReceivers(filter);
        const page = parseInt(req.query.page) || 0;
        const receivers = allReceivers.slice(page * entriesPerPage, (page + 1) * entriesPerPage);
        const pagination = {
            page,
            total: Math.ceil(allReceivers.length / entriesPerPage),
            buildPageLink: (page) => {
                const params = {...filter};
                if (page > 0) params.page = page;
                const qs = querystring.stringify(params);
                return '/' + (qs != '' ? '?' + qs : '');
            }
        }
        res.render('index', { receivers, filter, pagination });
    }
    impressum(req, res) {
        res.render('impressum');
    }
}

module.exports = IndexController;