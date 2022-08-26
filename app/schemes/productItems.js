module.exports = {
    autoIncrement: {
        type: 'object',
        properties: {
            spID: { type: 'number' },
            menuItemId: { type: 'number' },
            count: { type: 'number' }
        },
        required: ['spID', 'menuItemId', 'count'],
        additionalProperties: false
    },
};
