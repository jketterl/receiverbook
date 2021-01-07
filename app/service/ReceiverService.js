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
            const station = stations.find(station => s._id.toString() === station._id.toString());
            const stationReceivers = s.receivers.map(rid => receivers.find(r => r.id.toString() == rid.toString()));
            return this.transformReceiversOfStation(stationReceivers, station);
        });
        const receiversInStations = acceptedStations.flatMap(s => s.receivers.map(id => id.toString()));
        const receiverEntries = receivers
            .filter(r => receiversInStations.indexOf(r.id.toString()) < 0)
            .map(r => this.transformReceiverForView(r));
        return stationEntries.concat(receiverEntries);
    }
    async getPublicReceiversForMap() {
        const receivers = await this.getPublicReceivers();
        const receiversWithLocation = receivers.filter(r => r.location && r.location.coordinates);
        return receiversWithLocation.map(r => this.transformReceiverForMap(r));
    }
    transformReceiverForMap(receiver) {
        const out = {};
        const receivers = receiver.receivers || [ receiver ];
        ['label', 'location', 'url'].forEach(key => {
            out[key] = receiver[key];
        });
        const receiverViewObjects = receivers.map(r => {
            const out = {};
            ['label', 'version', 'url', 'type'].forEach(key => {
                out[key] = r[key];
            });
            return out;
        });
        out.receivers = receiverViewObjects;
        return out;
    }
    transformReceiverForView(receiver) {
        const imageService = new ImageService();
        const r = receiver.toObject();
        r.type = this.getPresentationType(receiver.type);
        r.bands = this.getPresentationBands(receiver);
        r.avatarUrl = imageService.getAvatarImageUrl(receiver);
        return r
    }
    transformReceiversOfStation(receivers, station) {
        const imageService = new ImageService();
        const avatarReceiver = receivers.filter(r => r.avatar_hash).shift();
        let avatarUrl;
        if (avatarReceiver) {
            avatarUrl = imageService.getAvatarImageUrl(avatarReceiver);
        }
        const locationReceiver = receivers.filter(r => r.location && r.location.coordinates).shift();
        let location;
        if (locationReceiver) {
            location = locationReceiver.location
        }
        const receiverEntry = {
            _id: station.id,
            label: station.label,
            receivers: receivers.map(r => this.transformReceiverForView(r)),
            avatarUrl,
            location
        }
        return receiverEntry;
    }
    getPresentationType(type) {
        switch (type) {
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
                try {
                    const result = await detector.matches(url);
                    return {
                        status: 'fulfilled',
                        type,
                        value: result
                    };
                } catch (err) {
                    return {
                        status: 'rejected',
                        type,
                        reason: err
                    };
                }
            })
        );

        const matches = resultArray.filter(e => e.status == 'fulfilled');
        if (matches.length) {
            const firstResult = matches[0].value;
            firstResult.type = matches[0].type;
            return {
                status: 'fulfilled',
                value: firstResult
            }
        }

        return {
            status: 'rejected',
            errors: resultArray.map(e => {
                const type = this.getPresentationType(e.type);
                const error = e.reason;
                return `${type} receiver type: ${error.message || "unknown error"}`
            })
        }
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