const admin = require('firebase-admin');
const { firebase: { key } } = require('app/settings');
const serviceAccount = require(key);
const logger = require('app/helpers/logger');

const FIREBASE_TOKENS_LIMIT = 500;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const sendNotification = async (title, body, tokens, data) => {
    return new Promise((resolve) => {
        const message = {
            notification: {
                title: title,
                body: body
            },
            tokens: tokens,
        };
        if (data) {
            message.data = data;
        }
        admin.messaging().sendMulticast(message).then((response) => {
            const failedTokens = [];
            const successTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                } else {
                    successTokens.push(tokens[idx]);
                }
            });
            resolve({ successCount: response.successCount, failureCount: response.failureCount, failedTokens, successTokens });
            if (response.failureCount > 0) {
                logger.error(response);
            }
        });
    });
};

const getPayloadForNotificationFilter = (payload, res) => {
    payload.successCount = payload.successCount + res.successCount;
    payload.failureCount = payload.failureCount + res.failureCount;
    payload.failedTokens = payload.failedTokens.concat(res.failedTokens);
    payload.successTokens = payload.successTokens.concat(res.successTokens);
    return payload;
};

module.exports.sendNotification = async (title, body, registrationTokens, data) => {
    let payload = {
        successCount: 0,
        failureCount: 0,
        failedTokens: [],
        successTokens: []
    };
    const onlyUnique = (value, index, self) => self.indexOf(value) === index;
    const uniqueTokens = registrationTokens.filter(onlyUnique);
    if (uniqueTokens.length > FIREBASE_TOKENS_LIMIT) {
        while (uniqueTokens.length > FIREBASE_TOKENS_LIMIT) {
            let currentGroup = uniqueTokens.splice(0, FIREBASE_TOKENS_LIMIT);
            let res = await sendNotification(title, body, currentGroup, data);
            payload = getPayloadForNotificationFilter(payload, res);

        }
    }
    let res = await sendNotification(title, body, uniqueTokens, data);
    payload = getPayloadForNotificationFilter(payload, res);
    return payload;
};