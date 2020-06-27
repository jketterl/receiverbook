const Station = require('../../models/Station');
const Receiver = require('../../models/Receiver');

class StationController {
    async index(req, res) {
        const stations = await Station.find({owner: req.user});
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
    async editStation(req, res) {
        const [station, receivers] = await Promise.all([
            Station.findOne({owner: req.user, _id: req.params.id}),
            Receiver.find({owner: req.user, station: null})
        ])
        if (!station) return res.status(404).send('station not found');
        res.render('my/editStation', { station, receivers });
    }
    async deleteStation(req, res) {
        await Station.deleteOne({owner: req.user, _id: req.params.id})
        res.redirect('/my/stations');
    }
}

module.exports = StationController;