const ReceiverService = require('../service/ReceiverService');
const config = require('../../config');

class MapController {
    async index(req, res) {
        const receiverService = new ReceiverService();
        const receivers = await receiverService.getPublicReceiversForMap();
        return res.render('map', { receivers, google_maps_api_key: config.google.maps.apiKey });
    }
}

module.exports = MapController;