const mongoose = require('mongoose');
const BandService = require('./BandService');
const ImageService = require('./ImageService');
const Receiver = require('../models/Receiver');
const Station = require('../models/Station');
const TypeService = require('./TypeService');

class ReceiverService {
    async getPublicReceivers(filter) {
        const mongoQuery = this.getMongoQuery(filter);
        const [receivers, stationsWithReceivers] = await Promise.all([
            Receiver.find({...mongoQuery, status: 'online'}),
            Receiver.aggregate()
                .match({...mongoQuery, station: {$ne: null}, status: 'online'})
                .group({_id: '$station', count: { $sum: 1 }, receivers: { $addToSet: "$_id"}})
        ]);
        const acceptedStations = stationsWithReceivers.filter(s => s.count > 1);
        const stations = await Station.find().where('_id').in(acceptedStations.map(s => s._id));
        const filteredReceivers = filter.band ? this.filterByBand(receivers, filter.band) : receivers;
        const stationEntries = acceptedStations.map(s => {
            const station = stations.find(station => s._id.toString() === station._id.toString());
            const stationReceivers = s.receivers
                .map(rid => filteredReceivers.find(r => r.id.toString() == rid.toString()))
                .filter(r => typeof(r) != 'undefined');
            return this.transformReceiversOfStation(stationReceivers, station);
        }).filter(s => s.receivers.length);
        const receiversInStations = acceptedStations.flatMap(s => s.receivers.map(id => id.toString()));
        const receiverEntries = filteredReceivers
            .filter(r => receiversInStations.indexOf(r.id.toString()) < 0)
            .map(r => this.transformReceiverForView(r));
        return stationEntries.concat(receiverEntries);
    }
    getMongoQuery(filter) {
        return Object.fromEntries(
            Object.entries(filter).filter(([key, value]) => {
                return key == 'type';
            })
        );
    }
    filterByBand(receivers, band) {
        const bandService = new BandService();
        return receivers.filter((r) => {
            return bandService.getMatchingBands(r.bands).map(b => b.id).includes(band);
        });
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
        const typeService = new TypeService();
        return typeService.getName(type);
    }
    async detectReceiverType(url) {
        const typeService = new TypeService();
        const resultArray = await Promise.all(
            Object.entries(typeService.getAdapters()).map(async ([type, detectorCls]) => {
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
        const typeService = new TypeService();
        return typeService.getAdapter(receiver.type);
    }
    async updateReceiver(receiver) {
        await this.getAdapter(receiver).updateReceiver(receiver);
    }
    getPresentationBands(receiver) {
        const bandService = new BandService();
        return bandService.getMatchingBands(receiver.bands);
    }
    applyCrawlingResult(receiver, result) {
        return this.getAdapter(receiver).applyCrawlingResult(receiver, result);
    }
}

module.exports = ReceiverService;