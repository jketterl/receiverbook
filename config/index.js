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
    }
};