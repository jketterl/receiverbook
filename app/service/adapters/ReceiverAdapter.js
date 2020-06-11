class ReceiverAdapter {
    async matches(baseUrl, key) {
        return false;
    }
    async updateReceiver(receiver) {
        console.info(`updating "${receiver.label}"`);
        const status = await this.matches(receiver.url, receiver.key);
        if (receiver.status === 'pending' || receiver.status === 'new') {
            if (status && status.validated) {
                // switch receiver online if validated
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
    parseResponse(response) {
        return Object.fromEntries(response.split('\n').map((line) => {
            const items = line.split('=');
            return [items[0], items.slice(1).join(': ')];
        }));
    }
    parseCoordinates(gpsString) {
        const matches = /^\(([0-9.]+), ([0-9.]+)\)$/.exec(gpsString)
        if (!matches) return false;
        // longitude first!!
        return[matches[2], matches[1]]
    }
}

module.exports = ReceiverAdapter;