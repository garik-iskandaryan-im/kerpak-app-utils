const schedule = require('node-schedule');
const { checkConnectivity } = require('./checkConnectivity');
const { sendNotificationReadyPreOrder } = require('./sendNotificationReadyPreOrder');
const { checkGroupSessions } = require('./checkGroupSessions');

const jobs = [
    {
        schedule: '*/5 * * * *',
        callback: checkConnectivity
    },
    {
        schedule: '*/5 * * * *',
        callback: sendNotificationReadyPreOrder
    },
    {
        schedule: '*/1 * * * *',
        callback: checkGroupSessions
    }
];

module.exports.start = () => {
    jobs.forEach(job => schedule.scheduleJob(job.schedule, job.callback));
};