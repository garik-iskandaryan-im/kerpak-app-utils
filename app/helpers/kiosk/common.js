const {
    kiosks: Kiosks,
    serviceProviders: ServiceProviders,
} = require('app/models/models');
const {
    connectionLogs: ConnectionLogs,
    kiosksUnstableConnectionStatus: KiosksUnstableConnectionStatus,
} = require('app/logsModels/models/models');
const {
    getConnectionEmailBody,
    getConnectionUnstableIssueEmailBody,
    getConnectionUnstableRecoverEmailBody,
    getConnectionUnstableCriticalIssueEmailBody,
} = require('app/helpers/email/adapters');
const { sendEmail } = require('app/services/aws');
const { getKOEmailsForConnectionAlerts, getSPUsersEmailsForConnectionAlerts } = require('app/helpers/email/destination');
const { Op } = require('sequelize');

const checkForUnstableConnection = async (id, displayName, SPEmails, KOEmails) => {
    const currentStatus = await KiosksUnstableConnectionStatus.findOne({ where: { kioskId: id } });
    let state;
    let lastActionDate;
    if (currentStatus && currentStatus.isConnectionUnstableCriticalAlert) {
        state = 'critical';
    } else if (currentStatus && currentStatus.isConnectionUnstableAlert) {
        state = 'issue';
        lastActionDate = currentStatus.lastActionDate;
    } else {
        state = 'recovered';
    }
    const currentDate = new Date();
    let date = new Date(currentDate.getTime() - 15 * 60 * 1000);
    const count = await ConnectionLogs.count({
        where: {
            kioskId: id,
            disconnectedAt: {
                [Op.and]: {
                    [Op.ne]: null,
                    [Op.gte]: date
                }
            }
        }
    });

    if (count > 2 && state === 'recovered') {
        const title = `Kerpak | ${displayName} | Unstable Connection`;
        const body = getConnectionUnstableIssueEmailBody(displayName);
        await sendEmail(KOEmails.connection, [], title, body);
        const payload = {
            isConnectionUnstableAlert: true,
            isConnectionRecovered: false,
            lastActionDate: new Date(),
            kioskId: id
        };
        await KiosksUnstableConnectionStatus.upsert(payload);
    } else if (count === 0 && (state === 'issue' || state === 'critical')) {
        const title = `Kerpak | ${displayName} | Unstable Connection`;
        const body = getConnectionUnstableRecoverEmailBody(displayName);
        await sendEmail(KOEmails.connection, [], title, body);
        const payload = {
            isConnectionUnstableAlert: false,
            isConnectionUnstableCriticalAlert: false,
            isConnectionRecovered: true,
            lastActionDate: new Date(),
            kioskId: id
        };
        await KiosksUnstableConnectionStatus.upsert(payload);
    }

    if (state === 'issue' && lastActionDate < new Date(currentDate.getTime() - 30 * 60 * 1000)) {
        const title = `[CRITICAL] Kerpak | ${displayName} | Unstable Connection`;
        const body = getConnectionUnstableCriticalIssueEmailBody(displayName);
        await sendEmail(SPEmails, KOEmails.critical, title, body);
        const payload = {
            isConnectionUnstableCriticalAlert: true,
            lastActionDate: new Date(),
            kioskId: id
        };
        await KiosksUnstableConnectionStatus.upsert(payload);
    }
};

const checkSocketConnection = async (kioskId, connectionEmail, displayName, serviceProviderId) => {
    const connectionLogs = await ConnectionLogs.findAll({ where: { kioskId }, order: [['id', 'DESC']], limit: 1 });
    if (connectionLogs.length === 0) {
        return;
    }
    const { spLostConnectionEmails, spCriticalConnectionEmails } = await getSPUsersEmailsForConnectionAlerts(serviceProviderId);
    const { koConnection, koLostConnection, koCriticalConnectionEmails } = await getKOEmailsForConnectionAlerts();
    const { connectedAt, disconnectedAt } = connectionLogs[0];
    const currentSP = await ServiceProviders.findOne({ where: { id: serviceProviderId }, attributes: ['timezone'] });
    if (disconnectedAt && connectionEmail !== 'issue email was been sent' && new Date().getTime() - new Date(disconnectedAt).getTime() > 15 * 1000 * 60) {
        const title = `Kerpak | ${displayName} | Lost Connection`;
        const body = getConnectionEmailBody(true, displayName, disconnectedAt, null, currentSP?.timezone);
        await sendEmail(spLostConnectionEmails, koLostConnection, title, body);
        await Kiosks.update({ connectionEmail: 'issue email was been sent' }, { where: { id: kioskId } });
    } else if (connectedAt && connectionEmail === 'issue email was been sent' && new Date().getTime() - new Date(connectedAt).getTime() > 15 * 1000 * 60) {
        const title = `Kerpak | ${displayName} | Lost Connection`;
        let disconnected = await ConnectionLogs.findAll({
            where: {
                kioskId,
                disconnectedAt: {
                    [Op.ne]: null
                }
            }, order: [['id', 'DESC']], limit: 1
        });
        if (disconnected.length) {
            const body = getConnectionEmailBody(false, displayName, disconnected[0].disconnectedAt, connectedAt, currentSP?.timezone);
            await sendEmail(spLostConnectionEmails, koLostConnection, title, body);
            await Kiosks.update({ connectionEmail: 'recovering email was been sent' }, { where: { id: kioskId } });
        }
    }
    await checkForUnstableConnection(kioskId, displayName, spCriticalConnectionEmails, { connection: koConnection, critical: koCriticalConnectionEmails });
};

module.exports = {
    checkSocketConnection
};
