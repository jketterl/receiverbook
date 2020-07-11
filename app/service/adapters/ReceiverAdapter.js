const UserService = require('../UserService');
const axios = require('axios');
const { S3 } = require('aws-sdk');
const config = require('../../../config');
const moment = require('moment');
const crypto = require('crypto');

class ReceiverAdapter {
    async getUrl(url, options={}) {
        const timeout = 10000;
        const source = axios.CancelToken.source();
        options.cancelToken = source.token;
        setTimeout(() => source.cancel("Connection Timeout"), timeout);
        return await axios.create({ timeout }).get(url, options);
    }
    normalizeUrl(url) {
        const normalized = new URL(url);
        if (!normalized.pathname.endsWith('/')) {
            normalized.pathname += '/';
        }
        return normalized
    }
    async matches(baseUrl, claims) {
        return false;
    }
    async updateReceiver(receiver) {
        console.info(`updating "${receiver.label}"`);
        const status = await this.getReceiverData(receiver);
        if (status) {
            receiver.status = "online";

            receiver.claims.forEach(claim => {
                if (status.validated && status.validated[claim.id]) {
                    claim.status = "verified";
                } else {
                    claim.status = "pending";
                }
            });

            this.applyCrawlingResult(receiver, status);

            const result = await this.downloadAvatar(receiver, status);
            if (result) {
                receiver.avatar_ctime = result.ctime;
                receiver.avatar_hash = result.hash;
            }
        } else {
            receiver.status = "offline";
        }

        await receiver.save();
    }
    applyCrawlingResult(receiver, data) {
        receiver.label = data.name;
        receiver.version = data.version;
        let location;
        if (data.location) {
            location = {
                type: 'Point',
                coordinates: data.location
            }
        }
        receiver.location = location;
        receiver.bands = data.bands;
    }
    async getReceiverData(receiver) {
        const status = await this.matches(receiver.url, receiver.claims);
        if (status.email) {
            status.validated = status.validated || {};
            await Promise.all(receiver.claims.map(async claim => {
                status.validated[claim.id] = status.validated[claim.id] || await this.validateEMail(claim, status.email);
            }));
        }
        return status;
    }
    async validateEMail(claim, email) {
        const userService = new UserService();
        const user = await userService.getUserDetails(claim.owner);
        return user.email_verified && user.email === email;
    }
    getAvatarUrl(receiver, status) {
        return false;
    }
    async downloadAvatar(receiver, status) {
        const avatarUrl = this.getAvatarUrl(receiver, status);
        if (!avatarUrl) {
            return
        }

        const headers = {};
        if (receiver.avatar_ctime && receiver.avatar_hash) {
            headers["If-Modified-Since"] = receiver.avatar_ctime.toUTCString();
        }

        let response
        try {
            response = await this.getUrl(avatarUrl.toString(), {
                responseType: 'stream',
                headers
            });
        } catch (err) {
            if (err.response && err.response.status == 304) {
                // avatar has not been changed
                console.info('received 304: avatar image not changed');
                return;
            }
            console.error('Error while downloading receiver avatar: ', err.stack);
            return;
        }

        const s3 = new S3();
        const [_, hash] = await Promise.all([
            s3.upload({
                Bucket: config.avatars.bucket.name,
                Region: config.avatars.bucket.region,
                Body: response.data,
                Key: `${receiver.id}-avatar.png`
            }).promise(),
            this.getMd5Hash(response.data)
        ]);

        const result = { hash }
        if (response.headers && response.headers['last-modified']) {
            result.ctime = moment(response.headers['last-modified']).toDate();
        } else {
            result.ctime = new Date();
        }

        return result;
    }
    async getMd5Hash(stream) {
        return new Promise((resolve, reject) =>{
            const hash = crypto.createHash('md5');
            stream.on('error', err => reject(err));
            stream.on('data', chunk => hash.update(chunk));
            stream.on('end', () => resolve(hash.digest('hex')));
        })
    }
}

module.exports = ReceiverAdapter;