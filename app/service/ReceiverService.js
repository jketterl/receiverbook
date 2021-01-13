const mongoose = require('mongoose');
const BandService = require('./BandService');
const ImageService = require('./ImageService');
const Receiver = require('../models/Receiver');
const Station = require('../models/Station');
const TypeService = require('./TypeService');

const NodeCache = require('node-cache');
const receiverCache = new NodeCache({stdTTL: 3600});
const querystring = require('querystring');

class ReceiverFilterService {
    constructor() {
        const bandService = new BandService();
        this.filters = {
            band: (receiver, band) => {
                if (band.startsWith('any-')) {
                    const service = band.substr(4);
                    return bandService.getMatchingBands(receiver.bands).flatMap(b => b.tags).includes(service);
                }
                if (band.startsWith('fr-')) {
                    const range = bandService.getRange(band.substr(3));
                    const receiverRanges = receiver.bands.map(rb => rb.asRange());
                    return receiverRanges.some(rb => {
                        return rb.start <= range.upper_bound && rb.end >= range.lower_bound;
                    });
                }
                return bandService.getMatchingBands(receiver.bands).map(b => b.id).includes(band)
            }
        }
    }
    filter(receivers, filter) {
        return receivers.filter(receiver => {
            return !filter.band || this.filters.band(receiver, filter.band);
        });
    }
}

class ReceiverService {
    async getPublicReceivers(filter) {
        const cacheKey = `receivers-${querystring.stringify(filter)}`;
        const fromCache = receiverCache.get(cacheKey);
        if (fromCache != undefined) return fromCache;
        const [receivers, stations] = await Promise.all([
            this.getFilteredReceivers(filter),
            Station.find()
        ]);

        const stationMap = receivers.reduce((agg, receiver) => {
            if (!receiver.station) return agg;
            (agg[receiver.station] = agg[receiver.station] || []).push(receiver);
            return agg;
        }, {});

        // perform station -> receivers relation lookup in bulk
        const stationsWithReceivers = stations.map(s => {
            return {
                station: s,
                receivers: stationMap[s._id.toString()] || []
            }
        })
        // only stations with at least 2 receivers will be shown as such
        const acceptedStations = stationsWithReceivers.filter(s => s.receivers.length > 1);

        const receiversInStations = acceptedStations.flatMap(s => s.receivers)

        // transform stations for view
        const stationEntries = acceptedStations.map(s => {
            return this.transformReceiversOfStation(s.receivers, s.station);
        });

        // transform receivers for view
        const receiverEntries = receivers
            .filter(r => !receiversInStations.includes(r))
            .map(r => this.transformReceiverForView(r));

        const result = [...stationEntries, ...receiverEntries];
        receiverCache.set(cacheKey, result);
        return result;
    }
    getMongoQuery(filter) {
        return Object.fromEntries(
            Object.entries(filter).filter(([key, value]) => {
                return key == 'type';
            })
        );
    }
    async getFilteredReceivers(filter) {
        const mongoQuery = this.getMongoQuery(filter);
        const receivers = await Receiver.find({...mongoQuery, status: 'online'})
        const filterService = new ReceiverFilterService();
        return filterService.filter(receivers, filter);
    }
    async getPublicReceiversForMap(filter) {
        const receivers = await this.getPublicReceivers(filter);
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
        // group by tags
        return bandService.getMatchingBands(receiver.bands).reduce((res, b) => {
            b.tags.forEach((t) => {
                res[t] = res[t] || {
                    name: bandService.getTagDisplayName(t),
                    bands: []
                }
                res[t].bands.push(b.name);
            });
            return res;
        }, {});
    }
    applyCrawlingResult(receiver, result) {
        return this.getAdapter(receiver).applyCrawlingResult(receiver, result);
    }
}

module.exports = ReceiverService;