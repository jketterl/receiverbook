const Station = require('../../models/Station');

class StationController {
    async index(req, res) {
        const stations = await Station.find({owner: req.user});
        console.info(stations);
        res.render('my/stations.ejs', { stations });
    }
    newStation(req, res) {
        res.render('my/newStation.ejs');
    }
    async processNewStation(req, res) {
        const station = new Station({
            label:req.body.label,
            owner: req.user
        });
        await station.save();
        res.redirect(`/my/stations/${station.id}`);
    }
}

module.exports = StationController;