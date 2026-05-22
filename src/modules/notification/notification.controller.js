const User = require('../../models/User');
const Class = require('../../models/Class');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { sendPush, sendWhatsApp } = require('../../utils/notify');

const sendNotification = asyncHandler(async (req, res) => {
  const { userIds, title, body, data, channels = ['push'] } = req.body;
  if (!title || !body) throw new ApiError(400, 'title and body required');
  const users = await User.find({ _id: { $in: userIds } }).select('fcmToken phone');
  if (channels.includes('push')) {
    const tokens = users.map(u => u.fcmToken).filter(Boolean);
    await sendPush(tokens, { title, body, data: data||{} });
  }
  if (channels.includes('whatsapp')) {
    for (const u of users) {
      if (u.phone) await sendWhatsApp(u.phone, title + ': ' + body);
    }
  }
  res.json(ApiResponse.success({ sent: users.length }, 'Notifications sent'));
});

const sendClassReminder = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.classId).populate('studentIds','fcmToken phone name');
  if (!cls) throw new ApiError(404, 'Class not found');
  const tokens = cls.studentIds.map(s => s.fcmToken).filter(Boolean);
  const scheduled = new Date(cls.scheduledAt).toLocaleString('en-IN');
  await sendPush(tokens, { title: 'Class reminder: ' + cls.title, body: 'Starting at ' + scheduled, data: { classId: cls._id.toString() } });
  res.json(ApiResponse.success({ sent: tokens.length }, 'Reminders sent'));
});

module.exports = { sendNotification, sendClassReminder };
