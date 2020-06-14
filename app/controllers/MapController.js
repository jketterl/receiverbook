const ReceiverService = require('../service/ReceiverService');
const config = require('../../config');

class MapController {
    async index(req, res) {
        const receiverService = new ReceiverService();
        const receivers = await receiverService.getPublicReceivers();
        const receiversWithLocation = receivers.filter(r => r.location && r.location.coordinates);
        return res.render('map', { receivers: receiversWithLocation, google_maps_api_key: config.google.maps.apiKey });
    }
}

module.exports = MapController;