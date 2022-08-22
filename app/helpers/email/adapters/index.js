const fs = require('fs');
const path = require('path');
const pupa = require('pupa');
const { collectDateString } = require('app/common/utils');

const compileTemperatureBodyError = (dateTime, error, errorMessage, temperature, isIssue, template, timezone) => {
    const dateString = collectDateString(dateTime, 'ddd, MMM DD YYYY, HH:mm', timezone);
    const params = {
        dateTime: dateString
    };
    if (!isIssue) {
        params.temperature = temperature;
    } else {
        params.errorMessage = error ? errorMessage : temperature;
    }
    return pupa(template, { ...params });
};

const getEmailBody = (isIssue, kioskName, temperatureLogs, timezone) => {
    const temperatureBodyTemplate = fs.readFileSync(path.resolve('app/helpers/email/templates/temperatureBody/temperatureBody.txt'), 'utf8').toString();
    const temperatureBodyError = fs.readFileSync(path.resolve('app/helpers/email/templates/temperatureBody/temperatureBodyError.txt'), 'utf8').toString();
    const temperatureBody = temperatureLogs.reduce((currentValue, { createdAt: dateTime, error, errorMessage, temperature },) => {
        return `
        ${currentValue}${compileTemperatureBodyError(dateTime, error, errorMessage, temperature, isIssue, isIssue ? temperatureBodyError : temperatureBodyTemplate, timezone)}
        `;
    }, '');
    let template = '';
    if (isIssue) {
        template = fs.readFileSync(path.resolve('app/helpers/email/templates/kioskStatus/kioskStatusError.txt'), 'utf8').toString();
    } else {
        template = fs.readFileSync(path.resolve('app/helpers/email/templates/kioskStatus/kioskStatus.txt'), 'utf8').toString();
    }
    const start = collectDateString(temperatureLogs[temperatureLogs.length - 1].createdAt, 'DD/MM/YYYY HH:mm', timezone);
    const end = collectDateString(temperatureLogs[0].createdAt, 'DD/MM/YYYY HH:mm', timezone);
    return pupa(template, { kioskName, temperatureBody, start, end });
};

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

const getCriticalEmailBody = (kioskName, date, time, rows) => {
    const template = fs.readFileSync(path.resolve('app/helpers/email/templates/criticalIssues/higthTemperature.txt'), 'utf8').toString();
    return pupa(template, { kioskName, date, time, rows });
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
    getEmailBody,
    getConnectionEmailBody,
    getCriticalEmailBody,
    getConnectionUnstableIssueEmailBody,
    getConnectionUnstableRecoverEmailBody,
    getConnectionUnstableCriticalIssueEmailBody
};