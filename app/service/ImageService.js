class ImageService {
    constructor() {
        // many receivers use the default image
        this.knownImageHashes = {
            '9035e8dc2bf28e5bd2d6f5c50d17d502': '/static/img/openwebrx-avatar.png'
        }
    }
    getAvatarImageUrl(receiver) {
        if (!receiver.avatar_hash) {
            return;
        }
        if (receiver.avatar_hash in this.knownImageHashes) {
            return this.knownImageHashes[receiver.avatar_hash];
        }
        return `/images/${receiver._id}/avatar.png`;
    }
}

module.exports = ImageService