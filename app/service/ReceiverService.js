const OpenWebRxAdapter = require('./adapters/OpenWebRxAdapter');
const WebSdrAdapter = require('./adapters/WebSdrAdapter');
const KiwiSdrAdapter = require('./adapters/KiwiSdrAdapter');
const mongoose = require('mongoose');
const BandService = require('./BandService');
const ImageService = require('./ImageService');
const Receiver = require('../models/Receiver');
const Station = require('../models/Station');

class ReceiverService {
    constructor(){
        this.adapters = {
            'openwebrx': OpenWebRxAdapter,
            'websdr': WebSdrAdapter,
            'kiwisdr': KiwiSdrAdapter
        }
    }
    async getPublicReceivers() {
        const [receivers, stationsWithReceivers] = await Promise.all([
            Receiver.find({status: 'online'}),
            Receiver.aggregate()
                .match({station: {$ne: null}, status: 'online'})
                .group({_id: '$station', count: { $sum: 1 }, receivers: { $addToSet: "$_id"}})
        ]);
        const acceptedStations = stationsWithReceivers.filter(s => s.count > 1);
        const stations = await Station.find().where('_id').in(acceptedStations.map(s => s._id));
        const stationEntries = acceptedStations.map(s => {
            const first = receivers.find(r => r.id = s.receivers[0]);
            const station = stations.find(station => s._id.toString() === station._id.toString());
            const receiverEntry = this.transformReceiverForView(first)
            receiverEntry.label = station.label;
            return receiverEntry;
        });
        const receiverEntries = receivers.map(r => this.transformReceiverForView(r));
        return stationEntries.concat(receiverEntries);
    }
    transformReceiverForView(receiver) {
        const imageService = new ImageService();
        const r = receiver.toObject();
        r.type = this.getPresentationType(receiver);
        r.avatarUrl = imageService.getAvatarImageUrl(receiver);
        return r
    }
    getPresentationType(receiver) {
        switch (receiver.type) {
            case 'openwebrx':
                return 'OpenWebRX';
            case 'websdr':
                return 'WebSDR';
            case 'kiwisdr':
                return 'KiwiSDR';
        }
        return 'Other';
    }
    async detectReceiverType(url) {
        const resultArray = await Promise.all(
            Object.entries(this.adapters).map(async ([type, detectorCls]) => {
                const detector = new detectorCls();
                return [type, await detector.matches(url)];
            })
        );
        const matches = resultArray.filter(e => e[1])
        if (!matches.length) return false;
        const firstResult = matches[0][1]
        firstResult.type = matches[0][0]
        return firstResult
    }
    getAdapter(receiver) {
        const adatperCls = this.adapters[receiver.type];
        return new adatperCls();
    }
    async updateReceiver(receiver) {
        await this.getAdapter(receiver).updateReceiver(receiver);
    }
    getPresentationBands(receiver) {
        const bandService = new BandService();
        return bandService.getMatchingBands(receiver.bands).map(b => b.name);
    }
    applyCrawlingResult(receiver, result) {
        return this.getAdapter(receiver).applyCrawlingResult(receiver, result);
    }
}

module.exports = ReceiverService;