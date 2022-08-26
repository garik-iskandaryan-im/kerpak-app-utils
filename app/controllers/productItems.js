const {
    productItems: ProductItems,
} = require('app/models/models');
const { productItems: productItemsValidator } = require('app/schemes');
const { isSchemeValid } = require('app/helpers/validate');
const log = require('app/helpers/logger');

const indexes = {};
const workers = {};
const handleQueue = async (spID, menuItemId, fromOut) => {
    if (!workers[spID]) {
        workers[spID] = {};
    }
    if (!workers[spID][menuItemId]) {
        workers[spID][menuItemId] = {
            inProgress: true
        };
    } else if (workers[spID][menuItemId].inProgress && fromOut) {
        return;
    } else if (!workers[spID][menuItemId].inProgress && fromOut) {
        workers[spID][menuItemId].inProgress = true;
    }
    const obj = indexes[spID][menuItemId].queue[0];
    await obj.cb(obj.spID, obj.menuItemId, obj.count, obj.resolve);
    indexes[spID][menuItemId].queue.shift();
    if (indexes[spID][menuItemId].queue.length) {
        return await handleQueue(spID, menuItemId);
    } else {
        workers[spID][menuItemId].inProgress = false;
    }
};

const cb = async (spID, menuItemId, count, resolve) => {
    if (indexes[spID][menuItemId].index) {
        let index = indexes[spID][menuItemId].index;
        indexes[spID][menuItemId].index += count;
        resolve(index);
    } else {
        const maxEAM5 = await ProductItems.max('EAN5', {
            where: {
                archived: false,
                menuItemId: menuItemId,
                serviceProviderId: spID
            }
        });
        let autoIncrement;
        if (!maxEAM5) {
            const amount = await ProductItems.count({
                where: {
                    archived: false,
                    menuItemId: menuItemId,
                    serviceProviderId: spID
                }
            });
            autoIncrement = amount + 1;
        } else {
            autoIncrement = maxEAM5 + 1;
        }
        indexes[spID][menuItemId].index = autoIncrement + count;
        resolve(autoIncrement);
    }
};

module.exports.getIndex = async (req, res) => {
    try {
        const { spID, menuItemId, count } = req.query;
        try {
            await isSchemeValid(productItemsValidator.autoIncrement, req.query);
        } catch (err) {
            log.error(err, 'productAutoIncrement::getIndex::validation');
            return res.status(400).json({ success: false, message: 'validation error' });
        }
        if (!indexes[spID]) {
            indexes[spID] = {};
        }
        if (!indexes[spID][menuItemId]) {
            indexes[spID][menuItemId] = {
                index: null,
                queue: [],
            };
        }
        indexes[spID][menuItemId].queue.push({
            spID,
            menuItemId,
            count: Number(count),
            resolve: (autoIncrement) => res.json(autoIncrement),
            cb
        });
        if (indexes[spID][menuItemId].queue.length) {
            handleQueue(spID, menuItemId, true);
        }
    } catch (err) {
        log.error(err, 'productAutoIncrement::getIndex::generic');
        res.status(500).send({ message: 'Generic error' });
    }
};