const OpenWebRXClassicAdapter = require('./OpenWebRXClassicAdapter');
const KeyService = require('../KeyService');
const semver = require('semver');

class OpenWebRxAdapter extends OpenWebRXClassicAdapter {
    async matches(baseUrl, claims) {
        const normalized = this.normalizeUrl(baseUrl);

        const headers = {};
        const keyService = new KeyService();

        let challenges;
        if (claims && claims.length) {
            challenges = claims.map(claim => {
                const key = keyService.parse(claim.key);
                return {
                    claim,
                    key,
                    challenge: keyService.generateChallenge(key)
                }
            })
            headers['Authorization'] = 'ReceiverId ' + challenges.map(c => c.challenge.toString()).join(',');
        }

        let statusResponse;
        try {
            const statusUrl = new URL(normalized);
            statusUrl.pathname += 'status.json';
            statusResponse = await this.getUrl(statusUrl.toString(), { headers });
        } catch (err) {
            if (err.response) {
                // if there was a response, it's worth checking for an OpenWebRX classic receiver
                return await super.matches(baseUrl);
            }
            throw(err);
        }

        const sh = statusResponse.headers;
        let validated;
        // new responses in OpenWebRX develop
        if (challenges && 'authorization' in sh) {
            try {
                const responses = keyService.parseResponse(sh['authorization']);
                validated = Object.fromEntries(challenges.map(challenge => {
                    const response = responses.find(r => r.source === challenge.key.source && r.id === challenge.key.id);
                    return [
                        challenge.claim.id,
                        response && keyService.validateSignature(
                            response.signature,
                            response.time,
                            challenge.challenge,
                            challenge.key
                        )
                    ];
                }))
            } catch (err) {
                console.error('Error checking OpenWebRX claim responses: ', err.stack || err.message);
            }
        }
        // code for parsing response headers in OpenWebRX 0.19.1
        else if (challenges && 'signature' in sh && 'time' in sh) {
            validated = Object.fromEntries(challenges.map(challenge => {
                return [
                    challenge.claim.id,
                    keyService.validateSignature(sh.signature, sh.time, challenge.challenge, challenge.key)
                ]
            }));
        }
        const data = statusResponse.data;
        if (typeof(data.sdrs) == 'undefined') {
            throw new Error('invalid response: sdrs missing');
        }
        if (
            typeof(data.receiver) == 'undefined' ||
            typeof(data.receiver.name) == 'undefined' ||
            typeof(data.receiver.admin) == 'undefined' ||
            typeof(data.receiver.gps) == 'undefined' ||
            typeof(data.receiver.gps.lon) == 'undefined' ||
            typeof(data.receiver.gps.lat) == 'undefined'
        ) {
            throw new Error('invalid response: receiver data missing');
        }

        // validate gps coordinates
        if (data.receiver.gps.lat < -90 || data.receiver.gps.lat > 90 || data.receiver.gps.lon < -180 || data.receiver.gps.lon > 180) {
            throw new Error('invalid gps coordinates');
        }

        if (data.receiver.name == '') {
            throw new Error('receiver name is empty');
        }

        if (data.receiver.name == '[Callsign]') {
            throw new Error('receiver uses default name');
        }

        if (data.receiver.admin == "example@example.com") {
            throw new Error('receiver uses default admin address');
        }

        if (data.receiver.gps.lat == 47 && data.receiver.gps.lon == 19) {
            throw new Error('receiver uses default location');
        }

        const version = this.parseVersion(data.version);
        if (!version) {
            throw new Error('receiver version information not available');
        }

        const bands = data.sdrs.flatMap(sdr => sdr.profiles).map(sdr => Object.assign(sdr, {'type': 'centered'}));

        return {
            name: data.receiver.name,
            email: data.receiver.admin,
            version,
            // longitude first !!
            location: [data.receiver.gps.lon, data.receiver.gps.lat],
            bands,
            validated
        }
    }
    parseVersion(versionString) {
        const matches = /^v(.*)$/.exec(versionString)
        if (!matches) return false;
        try {
            return (semver.parse(matches[1]) || semver.coerce(matches[1])).toString();
        } catch (err) {
            console.error(err)
            return false;
        }
    }
    getType() {
        return "OpenWebRX (classic)"
    }
    getAvatarUrl(receiver, status) {
        if (!receiver.hasVersion('0.18.0')) {
            return super.getAvatarUrl(receiver, status);
        }

        const avatarUrl = this.normalizeUrl(receiver.url);
        avatarUrl.pathname += 'static/gfx/openwebrx-avatar.png'
        return avatarUrl;
    }
}

module.exports = OpenWebRxAdapter;