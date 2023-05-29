module.exports = {
    rootUrl: process.env['ROOT_URL'],
    cognito: {
        region: process.env['COGNITO_REGION'],
        userPoolId: process.env['COGNITO_USER_POOL_ID'],
        clientId: process.env['COGNITO_CLIENT_ID'],
        clientSecret: process.env['COGNITO_CLIENT_SECRET']
    },
    session: {
        secret: process.env['SESSION_SECRET']
    },
    mongo: {
        url: process.env['MONGO_URL'],
        user: process.env['MONGO_USER'],
        password: process.env['MONGO_PASSWORD']
    },
    google: {
        maps: {
            apiKey: process.env['GOOGLE_MAPS_API_KEY']
        }
    },
    avatars: {
        bucket: {
            name: process.env['AVATARS_BUCKET_NAME'],
            region: process.env['AVATARS_BUCKET_REGION']
        }
    },
    userAgent: 'ReceiverbookCrawler/1.0 (+https://www.receiverbook.de)'
};