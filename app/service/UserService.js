const config = require('../../config');
const { CognitoIdentityServiceProvider } = require('aws-sdk');
const User = require('../models/User');

class UserService {
    async getUserDetails(username) {
        const provider = new CognitoIdentityServiceProvider({region: config.cognito.region});
        const result = await provider.adminGetUser({
            UserPoolId: config.cognito.userPoolId,
            Username: username
        }).promise();
        const attributes = Object.fromEntries(result['UserAttributes'].map(a => [a['Name'], a['Value']]));
        return new User(result['Username'], attributes.email, attributes.email_verified);
    }
}

module.exports = UserService;