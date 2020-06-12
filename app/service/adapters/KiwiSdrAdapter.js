const ReceiverAdapter = require('./ReceiverAdapter');
const axios = require('axios');

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
            if (version) {
                return {
                    name: parsed.name,
                    email: parse.op_email,
                    version,
                    location
                }
            }
        } catch (err) {
            console.error('Error detecting KiwSDR receiver: ', err);
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
}

module.exports = KiwiSdrAdapter;