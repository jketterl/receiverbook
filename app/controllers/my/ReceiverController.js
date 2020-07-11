const mongoose = require('mongoose');
const axios = require('axios');
const ReceiverService = require('../../service/ReceiverService');
const Receiver = require('../../models/Receiver');
const Station = require('../../models/Station');

class ReceiverController {
    async index(req, res) {
        const receivers = await Receiver.find({claims: {$elemMatch: {owner: req.user}}});
        res.render('my/receivers', { receivers });
    }
    async editReceiver(req, res) {
        const [receiver, stations] = await Promise.all([
            Receiver.findOne({claims: {$elemMatch: {owner: req.user}}, _id: req.params.id}).populate('station'),
            Station.find({owner: req.user})
        ]);
        if (!receiver) return res.status(404).send('receiver not found');
        res.render('my/editReceiver', { receiver, stations });
    }
    async regenerateKey(req, res) {
        const receiver = await Receiver.findOne({claims: {$elemMatch: {owner: req.user}}, _id: req.params.id});
        if (!receiver) return res.status(404).send("receiver not found");

        receiver.claims.find(c => c.owner === req.user).regenerateKey();
        await receiver.save();
        res.redirect(`/my/receivers/${receiver.id}`);
    }
    async assignToStation(req, res) {
        const [receiver, station] = await Promise.all([
            Receiver.findOne({claims: {$elemMatch: {owner: req.user, status: 'verified'}}, _id:req.params.id}),
            Station.findOne({owner: req.user, _id:req.body.station_id})
        ]);
        if (!receiver) return res.status(404).send('receiver not found');
        if (!station) return res.status(404).send('station not found');

        receiver.station = station;
        await receiver.save();
        res.redirect(`/my/receivers/${receiver.id}`);
    }
    async removeFromStation(req, res) {
        const receiver = await Receiver.findOne({claims: {$elemMatch: {owner: req.user, status: 'verified'}}, _id:req.params.id})
        if (!receiver) return res.status(404).send('receiver not found');
        receiver.station = undefined;
        await receiver.save();
        res.redirect(`/my/receivers/${receiver.id}`);
    }
    async claimReceiver(req, res) {
        const receiver = await Receiver.findOne({_id: req.params.id});
        if (!receiver) return res.status(404).send('receiver not found');
        if (!receiver.claims.some(c => c.owner === req.user)) {
            receiver.claims.push({
                owner: req.user
            });
            await receiver.save();
        }
        res.redirect(`/my/receivers/${receiver.id}`);
    }
    async unclaimReceiver(req, res) {
        const receiver = await Receiver.findOne({claims: {$elemMatch: {owner: req.user}}, _id:req.params.id}).populate('station');
        if (!receiver) return res.status(404).send('receiver not found');
        const index = receiver.claims.findIndex(c => c.owner === req.user);
        if (index >= 0) {
            receiver.claims.splice(index, 1);

            if (receiver.station && receiver.station.owner === req.user) {
                receiver.station = undefined;
            }
            await receiver.save();
        }
        res.redirect('/my/receivers');
    }
}

module.exports = ReceiverController;