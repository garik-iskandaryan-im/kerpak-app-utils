const {
    preOrders: PreOrders,
    consumers: Consumers,
} = require('app/models/models');
const { Op } = require('sequelize');

const log = require('app/helpers/logger');
const { sendNotification } = require('app/services/firebase');
const { PRE_ORDER_STATUS } = require('app/constants');
const fs = require('fs');
const path = require('path');

module.exports.sendNotificationReadyPreOrder = async () => {
    try {
        const condition = {
            notificationStatus: 'notSent',
            status: { [Op.in]: PRE_ORDER_STATUS.consumerScanPermission },
            deliveryDate: { [Op.lte]: new Date(Date.now() - (2 * 60 * 60 * 1000)) }
        };
        const preOrders = await PreOrders.findAll(
            {
                attributes: ['id', 'consumerId'],
                where: condition,
                include: [
                    { model: Consumers, attributes: ['firebaseRegistrationToken'] },
                ],
            }
        );
        if (!preOrders.length) {
            return;
        }
        const failedOrMissingIds = [];
        const successIds = [];
        for (const preOrder of preOrders) {
            if (preOrder.consumer.firebaseRegistrationToken) {
                const template = fs.readFileSync(path.resolve('app/helpers/notifications/templates/preOrders/readyPreOrder.txt'), 'utf8').toString();
                const { failedTokens, successTokens } = await sendNotification(
                    null,
                    template,
                    [preOrder.consumer.firebaseRegistrationToken],
                    { preOrderId: preOrder.id.toString(), pageName: 'preOrderedDetails' }
                );
                if (failedTokens.length) {
                    failedOrMissingIds.push(preOrder.id);
                }
                if (successTokens.length) {
                    successIds.push(preOrder.id);
                }
            } else {
                failedOrMissingIds.push(preOrder.id);
            }
        }
        if (failedOrMissingIds.length) {
            await PreOrders.update(
                { notificationStatus: 'fail' },
                { where: { id: { [Op.in]: failedOrMissingIds } } }
            );
        }
        if (successIds.length) {
            await PreOrders.update(
                { notificationStatus: 'sent' },
                { where: { id: { [Op.in]: successIds } } }
            );
        }
    } catch (err) {
        log.error(err, 'worker::sendNotificationWithInterval');
    }
};