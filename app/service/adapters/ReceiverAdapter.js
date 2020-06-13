const UserService = require('../UserService');

class ReceiverAdapter {
    async matches(baseUrl, key) {
        return false;
    }
    async updateReceiver(receiver) {
        console.info(`updating "${receiver.label}"`);
        const status = await this.getReceiverData(receiver);
        if (receiver.status === 'pending' || receiver.status === 'new') {
            if (status && status.validated) {
                // switch receiver online if validated
                console.info(`"${receiver.label}" has passed verification, setting online`)
                receiver.status = 'online'
            } else {
                receiver.status = 'pending';
            }
        } else {
            if (status) {
                if (status.validated) {
                    receiver.status = 'online';
                } else {
                    // switch back to pending if validation failed
                    console.info(`"${receiver.label}" has failed verifiation, setting pending`)
                    receiver.status = 'pending';
                }
            } else {
                receiver.status = 'offline';
            }
        }
        if (status) {
            receiver.label = status.name;
            receiver.version = status.version;
            receiver.location = status.location;
        }

        await receiver.save();
    }
    async getReceiverData(receiver) {
        const status = await this.matches(receiver.url, receiver.key);
        if (status.email) {
            status.validated = status.validated || await this.validateEMail(receiver, status.email);
        }
        return status;
    }
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
        return[matches[2], matches[1]]
    }
    async validateEMail(receiver, email) {
        const userService = new UserService();
        const user = await userService.getUserDetails(receiver.owner);
        return user.email_verified && user.email === email;
    }
}

module.exports = ReceiverAdapter;