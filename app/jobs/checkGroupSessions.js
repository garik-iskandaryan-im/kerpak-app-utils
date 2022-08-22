const {
    kiosks: Kiosks,
    groupSessions: GroupSessions,
} = require('app/models/models');
const { Op } = require('sequelize');
const Ivideon = require('app/services/ivideon');
const { ai: { TRY_GET_VIDEO_COUNT } } = require('app/settings');
const { groupSessionSendToAI } = require('app/services/ai');
const log = require('app/helpers/logger');

const getGroupSessionVideoId = async (groupSession) => {
    try {
        await Ivideon.initializeTokens();
        const exportData = await Ivideon.exportVideoForAi(groupSession);
        if (!exportData.success) {
            return { status: 'error' };
        }
        return { status: 'sessionClosed', videoId: exportData.videoId };
    } catch (err) {
        log.error(err, 'worker::getGroupSessionVideoId');
        return;
    }
};

const getGroupSessionClip = async (groupSession) => {
    try {
        await Ivideon.initializeTokens();
        const video = await Ivideon.getExportVideoForAi(groupSession.videoId);
        if (!video.success) {
            return { status: 'error', ...video };
        }
        const publicUrl = await Ivideon.getPublicURL(video.clip);
        const response = await groupSessionSendToAI({
            group_session_id: groupSession.id,
            clip: publicUrl,
            kiosk_id: groupSession.kioskId
        });
        if (!response.success || !response.body?.id) {
            log.error(response, 'worker::getGroupSessionClip::sendToAI');
            return { status: 'error', clip: video.clip };
        }
        return { status: 'readyForAi', clip: video.clip, inferenceId: response.body.id };
    } catch (err) {
        log.error(err, 'worker::getGroupSessionClip');
        return { status: 'error' };
    }
};

const checkGroupSessions = async () => {
    const groupSessions = await GroupSessions.findAll(
        {
            where: {
                status: ['pending', 'sessionClosed'],
                endDate: {
                    [Op.lt]: Date.now()
                },
                tryGetVideoCount: {
                    [Op.lte]: TRY_GET_VIDEO_COUNT
                }
            },
            include: [
                { model: Kiosks, attributes: ['ivideonCameraId'], required: true }
            ]
        }
    );
    if (!groupSessions?.length) {
        return;
    }
    for (const groupSession of groupSessions) {
        const updatedData = {};
        if (groupSession.videoId) {
            const clipData = await getGroupSessionClip(groupSession);
            if (clipData.status === 'error' && !(clipData?.body?.result && (clipData.body.result.status === 'in_queue' || clipData.body.result.status === 'in_progress'))) {
                updatedData.status = clipData.status;
            }
            if (clipData.clip) {
                updatedData.status = clipData.status;
                updatedData.clip = clipData.clip;
                updatedData.inferenceId = clipData.inferenceId;
            }
        } else {
            const videoData = await getGroupSessionVideoId(groupSession);
            if (videoData.status === 'error' || !videoData.clip) {
                if (groupSession.tryGetVideoCount >= TRY_GET_VIDEO_COUNT) {
                    updatedData.status = videoData.status;
                } else {
                    updatedData.tryGetVideoCount = groupSession.tryGetVideoCount + 1;
                }
            }
            if (videoData.videoId) {
                updatedData.status = videoData.status;
                updatedData.videoId = videoData.videoId;
                updatedData.tryGetVideoCount = 0;
            }
        }
        await GroupSessions.update(updatedData, { where: { id: groupSession.id } });
    }
};

module.exports = { checkGroupSessions };