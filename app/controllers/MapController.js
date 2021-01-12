const ReceiverService = require('../service/ReceiverService');
const FilterService = require('../service/FilterService');
const config = require('../../config');

class MapController {
    async index(req, res) {
        const filterService = new FilterService();
        const receiverService = new ReceiverService();
        const filter = filterService.getFiltersFromRequest(req);
        const receivers = await receiverService.getPublicReceiversForMap(filter);
        return res.render('map', { receivers, google_maps_api_key: config.google.maps.apiKey, filter});
    }
}

module.exports = MapController;