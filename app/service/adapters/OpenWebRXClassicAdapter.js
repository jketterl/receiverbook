const ReceiverAdapter = require('./ReceiverAdapter');

class OpenWebRXClassicAdapter extends ReceiverAdapter {
    parseResponse(response) {
        return Object.fromEntries(response.split('\n').map((line) => {
            const items = line.split('=');
            return [items[0], items.slice(1).join('=')];
        }));
    }
    parseCoordinates(gpsString) {
        const matches = /^\(([-0-9.]+), ?([-0-9.]+)\)$/.exec(gpsString)
        if (!matches) {
            throw new Error('receiver gps could not be parsed');
        }

        var lat = parseFloat(matches[1]);
        var lon = parseFloat(matches[2]);

        // validate gps coordinates
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            throw new Error('invalid gps coordinates');
        }
        // longitude first!!
        return[lon, lat]
    }
    async matches(baseUrl) {
        const normalized = this.normalizeUrl(baseUrl);

        const statusUrl = new URL(normalized);
        statusUrl.pathname += 'status';
        const statusResponse = await this.getUrl(statusUrl.toString());

        const parsed = this.parseResponse(statusResponse.data);
        const version = this.parseVersion(parsed.sw_version);
        if (!version) {
            throw new Error('receiver version information not available');
        }

        const location = this.parseCoordinates(parsed.gps);

        const bands = this.parseBands(parsed.bands);

        if (
            typeof(parsed.name) == 'undefined' ||
            typeof(parsed.op_email) == 'undefined' ||
            typeof(parsed.avatar_ctime) == 'undefined'
        ) {
            throw new Error('invalid response: receiver data missing');
        }

        return {
            name: parsed.name,
            email: parsed.op_email,
            version,
            location,
            bands,
            avatar_ctime: parsed.avatar_ctime
        }
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