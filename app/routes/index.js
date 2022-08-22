const ping = require('./ping');

const express = require('express');
const router = express.Router();

router.use('/ping', ping);

module.exports = router;