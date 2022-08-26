'use strict';

const productItems = require('app/controllers/productItems');
const auth = require('app/middlewares/auth');

module.exports = (app) => {
    app.route('/productItems/autoIncrement')
        .get(auth.authenticate, productItems.getIndex);
};