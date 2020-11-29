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

        try {
            const statusUrl = new URL(normalized);
            statusUrl.pathname += 'status.json';
            const statusResponse = await this.getUrl(statusUrl.toString(), { headers });
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
            if (typeof(data.receiver) == 'undefined' || typeof(data.receiver.name) == 'undefined') {
                throw new Error('invalid response: receiver data missing');
            }
            const version = this.parseVersion(data.version);
            const bands = data.sdrs.flatMap(sdr => sdr.profiles).map(sdr => Object.assign(sdr, {'type': 'centered'}));
            if (version) {
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
        } catch (err) {
            console.error('Error detecting OpenWebRX receiver: ', err.stack || err.message);
        }

        return await super.matches(baseUrl);
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