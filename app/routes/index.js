const ping = require('./ping');

const express = require('express');
const router = express.Router();

require('./productItems')(router);
router.use('/ping', ping);

module.exports = router;