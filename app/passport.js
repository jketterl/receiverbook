const passport = require('passport');
const axios = require('axios');
const jwkToPem = require('jwk-to-pem');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const jwt = require('jsonwebtoken');
const config = require('../config');

async function getJwks() {
    const response = await axios.get(`https://cognito-idp.${config.cognito.region}.amazonaws.com/${config.cognito.userPoolId}/.well-known/jwks.json`)
    const pems = {};
    response.data.keys.forEach(function(key){
        pems[key.kid] = jwkToPem(key);
    });
    return pems;
}

module.exports.setup = async () => {
    const pems = await getJwks();

    passport.use(new OAuth2Strategy({
        authorizationURL: 'https://login.receiverbook.de/login',
        tokenURL: 'https://login.receiverbook.de/oauth2/token',
        clientID: config.cognito.clientId,
        clientSecret: config.cognito.clientSecret,
        callbackURL: `${config.rootUrl}/session/receiveLogin`
    }, (accessToken, refreshToken, profile, done) => {
        jwt.verify(accessToken, (header, done) => {
            done(null, pems[header.kid]);
        }, (err, payload) => {
            if (err) return done(err);
            const groups = payload['cognito:groups'] || []

            done(null, {username: payload.username, groups: groups, accessToken: accessToken});
        });
    }));

    passport.serializeUser((user, done) => {
        done(null, user)
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });

    return passport;
}