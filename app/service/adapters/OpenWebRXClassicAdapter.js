const ReceiverAdapter = require('./ReceiverAdapter');

class OpenWebRXClassicAdapter extends ReceiverAdapter {
    parseResponse(response) {
        return Object.fromEntries(response.split('\n').map((line) => {
            const items = line.split('=');
            return [items[0], items.slice(1).join(': ')];
        }));
    }
    parseCoordinates(gpsString) {
        const matches = /^\(([-0-9.]+), ([-0-9.]+)\)$/.exec(gpsString)
        if (!matches) return false;
        // longitude first!!
        return[parseFloat(matches[2]), parseFloat(matches[1])]
    }
    async matches(baseUrl) {
        const normalized = this.normalizeUrl(baseUrl);

        try {
            const statusUrl = new URL(normalized);
            statusUrl.pathname += 'status';
            const statusResponse = await this.getUrl(statusUrl.toString())
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
                    bands,
                    avatar_ctime: parsed.avatar_ctime
                }
            }
        } catch (err) {
            console.error(`Error detecting ${this.getType()} receiver: `, err.stack || err.message);
        }

        return false;
    }
    parseBands(bandString) {
        const matches = /^([0-9]+)-([0-9]+)$/.exec(bandString)
        if (matches) {
            return {
                type: 'range',
                start_freq: matches[1],
                end_freq: matches[2]
            }
        }
        return []
    }
    getAvatarUrl(receiver, status) {
        if (status.avatar_ctime && receiver.avatar_ctime && receiver.avatar_hash) {
            const ref = new Date(parseFloat(status.avatar_ctime) * 1000);
            if (ref <= receiver.avatar_ctime) {
                console.info('skipping avatar download since avatar_ctime indicates we have the latest');
                return false;
            }
        }
        const avatarUrl = this.normalizeUrl(receiver.url);
        avatarUrl.pathname += 'gfx/openwebrx-avatar.png'
        return avatarUrl;
    }
}

module.exports = OpenWebRXClassicAdapter;