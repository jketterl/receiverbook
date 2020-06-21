const { S3 } = require('aws-sdk');
const config = require('../../config');

class ImageController {
    async avatar(req, res) {
        const s3 = new S3();
        const response = await s3.getObject({
            Bucket: config.avatars.bucket.name,
            Key: `${req.params.id}-avatar.png`
        }).promise();
        res.set('Content-Type', 'image/png');
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(response['Body']);
    }
}

module.exports = ImageController;