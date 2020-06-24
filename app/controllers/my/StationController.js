const Station = require('../../models/Station');

class StationController {
    async index(req, res) {
        const stations = Station.find({owner: req.user});
        res.render('my/stations.ejs', { stations });
    }
    newStation(req, res) {
        res.render('my/newStation.ejs');
    }
}

module.exports = StationController;