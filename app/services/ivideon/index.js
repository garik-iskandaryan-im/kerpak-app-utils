const Got = require('got');
const { integrations: Integrations } = require('app/models/models');
const { ivideon: { URL: ivideonUrl } } = require('app/settings');
const log = require('app/helpers/logger');

class Ivideon {
    constructor() {
        if (typeof Ivideon.instance === 'object') {
            return Ivideon.instance;
        }
        Ivideon.instance = this;
        return this;
    }

    async initializeTokens() {
        const ivideon = await Integrations.findOne({ name: 'ivideon' });
        if (!ivideon) {
            return false;
        }
        this.accessToken = ivideon.accessToken;
        this.refreshToken = ivideon.refreshToken;
        this.ivideonId = ivideon.id;
        this.criticalError = ivideon.criticalError;
        return true;
    }

    async getPublicURL(clip) {
        const accessToken = this.accessToken;
        const url = `${clip}&access_token=${accessToken}`;
        try {
            const instance = Got.extend({ followRedirect: false });
            const res = await instance.get(url);
            return res.headers.location;
        } catch (err) {
            log.error(err, 'ivideon::adapter:getPublicURL');
        }
    }

    async exportVideoForAi(groupSession) {
        const accessToken = this.accessToken;
        const urlForExport = `${ivideonUrl}/v1.0/cameras/${groupSession.kiosk.ivideonCameraId}/archive?op=EXPORT&access_token=${accessToken}`;
        const requestOptionsForExport = {
            json: {
                'access_token': accessToken,
                'start_time': new Date(groupSession.startDate).getTime() / 1000,
                'end_time': new Date(groupSession.endDate).getTime() / 1000
            },
            rejectUnauthorized: false,
            responseType: 'json'
        };
        try {
            const { body } = await Got.post(urlForExport, requestOptionsForExport);
            if (!body?.result?.id) {
                log.error(body, 'ivideon::adapter:getVideoForAi::EXPORT');
                return { success: false, body };
            }
            return { success: true, videoId: body.result.id };
        } catch (err) {
            log.error(err, 'ivideon::adapter:getVideoForAi::EXPORT::generic');
            return { success: false, err };
        }
    }
    async getExportVideoForAi(exportVideoId) {
        const accessToken = this.accessToken;
        const urlForGetVideo = `${ivideonUrl}/v1.0/exported_records/${exportVideoId}?op=GET&access_token=${accessToken}`;
        const requestOptionsForGetVideo = {
            json: {},
            rejectUnauthorized: false,
            responseType: 'json'
        };
        try {
            const { body } = await Got.post(urlForGetVideo, requestOptionsForGetVideo);
            if (!body?.result?.video_url) {
                log.error(body, 'ivideon::adapter:getExportVideoForAi::GET');
                return { success: false, body };
            }
            return { success: true, clip: body.result.video_url };
        } catch (err) {
            log.error(err, 'ivideon::adapter:getExportVideoForAi::generic');
            return { success: false, err };
        }
    }
}

module.exports = new Ivideon();