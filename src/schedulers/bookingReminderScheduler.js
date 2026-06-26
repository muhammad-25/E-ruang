const BookingModel = require('../models/bookingModel');
const ChatModel = require('../models/chatModel');
const { formatConversation, formatMessage } = require('../utils/chatFormatters');

const REMINDERS = [
  { type: 'H-1', hoursBefore: 24, label: 'H-1' },
  { type: 'H-3', hoursBefore: 3, label: '3 jam lagi' }
];

let isRunning = false;
let intervalId = null;

function formatDateTime(value) {
  const date = new Date(value);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function buildReminderMessage(booking, reminder) {
  const roomLocation = [booking.room_name, booking.gedung, booking.nomor_ruang ? `Ruang ${booking.nomor_ruang}` : null]
    .filter(Boolean)
    .join(', ');

  return [
    `Pengingat peminjaman ruangan ${reminder.label}.`,
    `Ruangan: ${roomLocation || '-'}.`,
    `Waktu mulai: ${formatDateTime(booking.start_datetime)}.`,
    'Silakan pastikan kebutuhan kegiatan sudah siap.'
  ].join(' ');
}

async function emitReminder(io, thread, message, adminId) {
  if (!io || !thread || !message) return;

  const conversations = await ChatModel.listConversationsForAdmin(adminId);
  const conversation = conversations.find((item) => Number(item.id) === Number(thread.id));
  const formattedMessage = formatMessage(message);
  const formattedConversation = formatConversation(conversation || { ...thread, unread_count: 0 });

  io.to(`thread:${thread.id}`).emit('chat:message', {
    conversation: formattedConversation,
    message: formattedMessage,
  });

  io.to('admins').emit('chat:conversation_updated', {
    conversation: formattedConversation,
    message: formattedMessage,
  });

  io.to(`user:${thread.user_id}`).emit('chat:conversation_updated', {
    thread_id: thread.id,
    message: formattedMessage,
  });
}

async function sendReminder(booking, reminder, io) {
  const messageText = buildReminderMessage(booking, reminder);

  try {
    const adminId = await ChatModel.getAdminUserId();
    if (!adminId) {
      throw new Error('Admin pengirim reminder tidak ditemukan.');
    }

    const thread = await ChatModel.getOrCreateThreadForUser(booking.requester_id, adminId);
    const message = await ChatModel.createMessage({
      threadId: thread.id,
      senderId: adminId,
      messageText
    });

    await BookingModel.logReminder(booking.id, reminder.type, 'sent', messageText);
    await emitReminder(io, thread, message, adminId);
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') return;

    try {
      await BookingModel.logReminder(
        booking.id,
        reminder.type,
        'failed',
        messageText,
        error.message || 'Gagal mengirim reminder.'
      );
    } catch (logError) {
      if (!logError || logError.code !== 'ER_DUP_ENTRY') {
        console.error('Gagal menyimpan log reminder:', logError);
      }
    }

    console.error(`Gagal mengirim reminder booking ${booking.id}:`, error);
  }
}

async function runBookingReminders(io) {
  if (isRunning) return;
  isRunning = true;

  try {
    for (const reminder of REMINDERS) {
      const bookings = await BookingModel.getBookingsNeedingReminder(reminder.type, reminder.hoursBefore);
      for (const booking of bookings) {
        await sendReminder(booking, reminder, io);
      }
    }
  } catch (error) {
    console.error('Booking reminder scheduler error:', error);
  } finally {
    isRunning = false;
  }
}

function startBookingReminderScheduler(io) {
  if (intervalId) return intervalId;

  runBookingReminders(io);
  intervalId = setInterval(() => runBookingReminders(io), 10 * 60 * 1000);
  return intervalId;
}

module.exports = {
  startBookingReminderScheduler,
  runBookingReminders
};
