const fs = require('fs');
const path = require('path');
const pupa = require('pupa');
const { collectDateString } = require('app/common/utils');

const getConnectionEmailBody = (isIssue, displayName, disconnectedAt, connectedAt, timezone) => {
    const params = {
        displayName
    };
    let template;
    if (isIssue) {
        template = fs.readFileSync(path.resolve('app/helpers/email/templates/socket/connectionIssue.txt'), 'utf8').toString();
        params.disconnectedAt = collectDateString(disconnectedAt, 'HH:mm', timezone);
        params.date = collectDateString(disconnectedAt, 'DD.MM.YYYY', timezone);
    } else {
        template = fs.readFileSync(path.resolve('app/helpers/email/templates/socket/connectionRecover.txt'), 'utf8').toString();
        params.connectedAt = collectDateString(connectedAt, 'HH:mm', timezone);
        params.disconnectedAt = collectDateString(disconnectedAt, 'HH:mm', timezone);
        params.now = collectDateString(new Date(), 'HH:mm', timezone);
        params.disconnectedDate = collectDateString(disconnectedAt, 'DD.MM.YYYY', timezone);
        params.connectedDate = collectDateString(connectedAt, 'DD.MM.YYYY', timezone);
    }
    return pupa(template, params);
};

const getConnectionUnstableIssueEmailBody = (kioskName) => {
    const template = fs.readFileSync(path.resolve('app/helpers/email/templates/unstableConnection/unstableConnectionIssue.txt'), 'utf8').toString();
    return pupa(template, { kioskName });
};

const getConnectionUnstableRecoverEmailBody = (kioskName) => {
    const template = fs.readFileSync(path.resolve('app/helpers/email/templates/unstableConnection/unstableConnectionRecover.txt'), 'utf8').toString();
    return pupa(template, { kioskName });
};

const getConnectionUnstableCriticalIssueEmailBody = (kioskName) => {
    const template = fs.readFileSync(path.resolve('app/helpers/email/templates/unstableConnection/unstableConnectionCriticalIssue.txt'), 'utf8').toString();
    return pupa(template, { kioskName });
};

module.exports = {
    getConnectionEmailBody,
    getConnectionUnstableIssueEmailBody,
    getConnectionUnstableRecoverEmailBody,
    getConnectionUnstableCriticalIssueEmailBody
};