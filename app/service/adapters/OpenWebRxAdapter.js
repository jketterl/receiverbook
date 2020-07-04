const OpenWebRXClassicAdapter = require('./OpenWebRXClassicAdapter');
const KeyService = require('../KeyService');
const semver = require('semver');

class OpenWebRxAdapter extends OpenWebRXClassicAdapter {
    async matches(baseUrl, key) {
        const normalized = this.normalizeUrl(baseUrl);

        const headers = {};
        const keyService = new KeyService();
        let challenge;
        let parsedKey;
        if (key) {
            parsedKey = keyService.parse(key);
            challenge = keyService.generateChallenge(parsedKey);
            headers['Authorization'] = keyService.getAuthorizationHeader(challenge);
        }

        try {
            const statusUrl = new URL(normalized);
            statusUrl.pathname += 'status.json';
            const statusResponse = await this.getUrl(statusUrl.toString(), { headers })
            const sh = statusResponse.headers
            let validated = false
            if (parsedKey && 'authorization' in sh) {
                validated = keyService.validateHeader(sh['authorization'], challenge, parsedKey);
            }
            if (parsedKey && 'signature' in sh && 'time' in sh) {
                validated = keyService.validateSignature(sh.signature, sh.time, challenge, parsedKey);
            }
            const data = statusResponse.data;
            const version = this.parseVersion(data.version);
            const bands = data.sdrs.flatMap(sdr => sdr.profiles).map(sdr => Object.assign(sdr, {'type': 'centered'}));
            if (version) {
                return {
                    name: data.receiver.name,
                    email: data.receiver.admin,
                    version,
                    // longitude first !!
                    location: [data.receiver.gps.lon, data.receiver.gps.lat],
                    validated,
                    bands
                }
            }
        } catch (err) {
            console.error('Error detecting OpenWebRX receiver: ', err.stack || err.message);
        }

        return await super.matches(baseUrl, key);
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