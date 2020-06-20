const ReceiverAdapter = require('./ReceiverAdapter');
const axios = require('axios');
const semver = require('semver');

class KiwiSdrAdapter extends ReceiverAdapter {
    async matches(baseUrl, key) {
        const normalized = new URL(baseUrl);
        if (!normalized.pathname.endsWith('/')) {
            normalized.pathname += '/';
        }

        try {
            const statusUrl = new URL(normalized);
            statusUrl.pathname += 'status';
            const statusResponse = await axios.get(statusUrl.toString())
            const parsed = this.parseResponse(statusResponse.data);
            const version = this.parseVersion(parsed.sw_version);
            const location = this.parseCoordinates(parsed.gps);
            const bands = this.parseBands(parsed.bands);
            if (version) {
                return {
                    name: parsed.name,
                    email: parsed.op_email,
                    version,
                    location,
                    bands
                }
            }
        } catch (err) {
            console.error('Error detecting KiwSDR receiver: ', err.stack);
        }
    }
    parseVersion(versionString) {
        const matches = /^KiwiSDR_v(.*)$/.exec(versionString)
        if (!matches) return false;
        try {
            return semver.coerce(matches[1]).toString();
        } catch (err) {
            console.error(err)
            return false;
        }
    }
    parseBands(bandString) {
        const matches = /^([0-9]+)-([0-9]+)$/.exec(bandString)
        return {
            type: 'range',
            start_freq: matches[1],
            end_freq: matches[2]
        }
    }
}

module.exports = KiwiSdrAdapter;