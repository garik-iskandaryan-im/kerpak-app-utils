const {
    kiosks: Kiosks,
} = require('app/models/models');
const {
    temperatureLogs: TemperatureLogs,
} = require('app/logsModels/models/models');

const logger = require('app/helpers/logger');

const { checkSocketConnection } = require('app/helpers/kiosk/common');
const ACTIVE_STATUS = 'active';

const Got = require('got');

const getTemperature = async (ip) => {
    const requestOptions = {
        responseType: 'json',
        https: {
            rejectUnauthorized: false,
        },
        timeout: 10000
    };
    return await Got.get(`https://${ip}/api/fridgeTemperature`, requestOptions);
};

const getKiosksStatus = async (ip, kioskId) => {
    try {
        const { body: obj } = await getTemperature(ip);
        let temperature = null;
        try {
            temperature = Number(obj.fridgeTemperature).toFixed(1);
            await TemperatureLogs.create({ kioskId: kioskId, error: false, temperature });
        } catch (err) {
            await TemperatureLogs.create({
                kioskId: kioskId,
                error: true,
                errorMessage: err?.response?.body?.fridgeTemperature || err.message
            });
        }
        await Kiosks.update({ temperature, connected: true }, { where: { id: kioskId } });
        return true;
    } catch (err) {
        let connected = false;
        if (err?.response?.body?.fridgeTemperature) {
            connected = true;
        }
        await Kiosks.update({ temperature: null, connected }, { where: { id: kioskId } });
        await TemperatureLogs.create({
            kioskId: kioskId,
            error: true,
            errorMessage: err?.response?.body?.fridgeTemperature || err.message
        });
        logger.error(err, 'kiosk::worker::getKiosksStatus');
        return false;
    }
};

module.exports.checkConnectivity = async () => {
    const kiosks = await Kiosks.findAll({ where: { status: ACTIVE_STATUS } });
    if (kiosks && Array.isArray(kiosks)) {
        for (const kiosk of kiosks) {
            const { ip, id, connectionEmail, displayName, serviceProviderId, useSocket, isCoffeeMachine } = kiosk;
            if (isCoffeeMachine) {
                continue;
            }
            if (useSocket) {
                await checkSocketConnection(id, connectionEmail, displayName, serviceProviderId);
            } else if (ip) {
                await getKiosksStatus(ip, id);
            }
        }
    }
};