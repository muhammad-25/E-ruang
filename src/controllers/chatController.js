const ChatModel = require('../models/chatModel');
const { formatConversation, formatMessage } = require('../utils/chatFormatters');

function isAdminSession(req) {
  return Number(req.session.userRoleId) === 1;
}

async function getThreadForRequest(req, threadId) {
  const thread = await ChatModel.getThreadById(threadId);
  if (!thread) return null;

  if (isAdminSession(req)) return thread;
  if (Number(thread.user_id) === Number(req.session.userId)) return thread;

  return false;
}

async function emitChatUpdate(req, thread, message) {
  const io = req.app.get('io');
  if (!io || !thread || !message) return;

  const adminId = await ChatModel.getAdminUserId();
  const conversations = await ChatModel.listConversationsForAdmin(adminId || req.session.userId);
  const conversation = conversations.find((item) => Number(item.id) === Number(thread.id));
  const formattedMessage = formatMessage(message);

  io.to(`thread:${thread.id}`).emit('chat:message', {
    conversation: formatConversation(conversation || { ...thread, unread_count: 0 }),
    message: formattedMessage,
  });

  io.to('admins').emit('chat:conversation_updated', {
    conversation: formatConversation(conversation || { ...thread, unread_count: 0 }),
    message: formattedMessage,
  });

  io.to(`user:${thread.user_id}`).emit('chat:conversation_updated', {
    thread_id: thread.id,
    message: formattedMessage,
  });
}

exports.getMyConversation = async (req, res) => {
  try {
    if (isAdminSession(req)) {
      return res.status(400).json({
        success: false,
        message: 'Admin menggunakan endpoint daftar percakapan.',
      });
    }

    const adminId = await ChatModel.getAdminUserId();
    const thread = await ChatModel.getOrCreateThreadForUser(req.session.userId, adminId);
    const messages = await ChatModel.listMessages(thread.id, req.query.limit);
    const unreadCount = await ChatModel.getUnreadCount(thread.id, req.session.userId);

    return res.json({
      success: true,
      conversation: formatConversation({ ...thread, unread_count: unreadCount }),
      messages: messages.map(formatMessage),
    });
  } catch (err) {
    console.error('Get my chat conversation error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil percakapan chat.',
    });
  }
};

exports.listConversations = async (req, res) => {
  try {
    const conversations = await ChatModel.listConversationsForAdmin(req.session.userId);

    return res.json({
      success: true,
      conversations: conversations.map(formatConversation),
    });
  } catch (err) {
    console.error('List chat conversations error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar percakapan.',
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const thread = await getThreadForRequest(req, req.params.threadId);

    if (thread === null) {
      return res.status(404).json({
        success: false,
        message: 'Percakapan tidak ditemukan.',
      });
    }

    if (thread === false) {
      return res.status(403).json({
        success: false,
        message: 'Tidak boleh mengakses percakapan ini.',
      });
    }

    const messages = await ChatModel.listMessages(thread.id, req.query.limit);
    const unreadCount = await ChatModel.getUnreadCount(thread.id, req.session.userId);

    return res.json({
      success: true,
      conversation: formatConversation({ ...thread, unread_count: unreadCount }),
      messages: messages.map(formatMessage),
    });
  } catch (err) {
    console.error('Get chat messages error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil pesan chat.',
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const text = String(req.body.message_text || req.body.message || '').trim();

    if (!text) {
      return res.status(422).json({
        success: false,
        message: 'Pesan tidak boleh kosong.',
      });
    }

    let thread;
    if (isAdminSession(req)) {
      const threadId = req.body.thread_id || req.body.conversation_id;
      if (!threadId) {
        return res.status(422).json({
          success: false,
          message: 'thread_id wajib dikirim untuk pesan admin.',
        });
      }

      thread = await getThreadForRequest(req, threadId);
      if (!thread) {
        return res.status(thread === null ? 404 : 403).json({
          success: false,
          message: thread === null ? 'Percakapan tidak ditemukan.' : 'Tidak boleh mengakses percakapan ini.',
        });
      }

      thread = await ChatModel.assignAdmin(thread.id, req.session.userId);
    } else {
      const adminId = await ChatModel.getAdminUserId();
      thread = await ChatModel.getOrCreateThreadForUser(req.session.userId, adminId);
    }

    const message = await ChatModel.createMessage({
      threadId: thread.id,
      senderId: req.session.userId,
      messageText: text,
    });

    await emitChatUpdate(req, thread, message);

    return res.status(201).json({
      success: true,
      conversation: formatConversation(thread),
      message: formatMessage(message),
    });
  } catch (err) {
    console.error('Send chat message error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengirim pesan chat.',
    });
  }
};

exports.markRead = async (req, res) => {
  try {
    const thread = await getThreadForRequest(req, req.params.threadId);

    if (thread === null) {
      return res.status(404).json({
        success: false,
        message: 'Percakapan tidak ditemukan.',
      });
    }

    if (thread === false) {
      return res.status(403).json({
        success: false,
        message: 'Tidak boleh mengakses percakapan ini.',
      });
    }

    const affectedRows = await ChatModel.markThreadRead(thread.id, req.session.userId);
    const io = req.app.get('io');
    if (io && affectedRows > 0) {
      io.to(`thread:${thread.id}`).emit('chat:read', {
        thread_id: thread.id,
        reader_id: req.session.userId,
      });
      io.to('admins').emit('chat:conversation_read', {
        thread_id: thread.id,
        reader_id: req.session.userId,
      });
    }

    return res.json({
      success: true,
      affected_rows: affectedRows,
    });
  } catch (err) {
    console.error('Mark chat read error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal menandai pesan sudah dibaca.',
    });
  }
};
