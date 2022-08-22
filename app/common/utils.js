const moment = require('moment');

const YEREVAN_TIME_ZONE = '+04:00';

const collectDateString = (dateTime, format, timezone = YEREVAN_TIME_ZONE) => moment(dateTime).utcOffset(timezone).format(format).toString();

module.exports = { collectDateString };