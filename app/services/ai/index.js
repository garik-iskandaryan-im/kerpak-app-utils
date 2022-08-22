const jwt = require('jsonwebtoken');
const Got = require('got');
const { ai: { URL: AI_URL }, jwt: { secrets: { aiSecretKeyBase } } } = require('app/settings');
const log = require('app/helpers/logger');
const { JWT_AI } = require('app/constants');

const createAccessToken = () => {
    return new Promise((resolve, reject) => {
        try {
            const token = jwt.sign(
                {
                    client: JWT_AI.client
                },
                aiSecretKeyBase,
                {
                    algorithm: JWT_AI.algorithm,
                    expiresIn: JWT_AI.expiration
                }
            );
            return resolve(token);
        }
        catch (e) {
            return reject(e);
        }
    });
};

const groupSessionSendToAI = async (requestBody = {}) => {
    try {
        const requestOptions = {
            headers: {
                authorization: await createAccessToken(),
            },
            json: requestBody,
            rejectUnauthorized: false,
            responseType: 'json'
        };
        const { body } = await Got.post(`${AI_URL}/v1/inference`, requestOptions);
        return { success: true, body };
    } catch (err) {
        log.error(err, 'worker::getGroupSessionClip::sendToAI');
        return { success: false };
    }
};

module.exports = { groupSessionSendToAI };