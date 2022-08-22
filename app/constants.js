'use strict';

module.exports = {
    PRE_ORDER_STATUS: {
        consumerScanPermission: ['delivered']
    },
    USERS_ROLES: {
        superAdmin: {
            name: 'superAdmin',
        },
        kerpakAdmin: {
            name: 'kerpakAdmin',
        },
        kerpakSupport: {
            name: 'kerpakSupport',
        },
        accountHolder: {
            name: 'accountHolder',
        },
        admin: {
            name: 'admin',
        },
    },

    JWT_AI: {
        client: 'Kerpak',
        algorithm: 'HS256',
        /*2 days (in seconds)*/
        expiration: 172800
    }
};