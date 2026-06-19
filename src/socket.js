const { Server } = require('socket.io');
const ChatModel = require('./models/chatModel');
const { formatConversation, formatMessage } = require('./utils/chatFormatters');

function isAdminSession(session) {
  return Number(session.userRoleId) === 1;
}

function socketAck(callback, payload) {
  if (typeof callback === 'function') {
    callback(payload);
  }
}

async function getConversationForThread(threadId, adminId) {
  const conversations = await ChatModel.listConversationsForAdmin(adminId);
  return conversations.find((conversation) => Number(conversation.id) === Number(threadId));
}

async function canAccessThread(session, threadId) {
  const thread = await ChatModel.getThreadById(threadId);
  if (!thread) return null;
  if (isAdminSession(session)) return thread;
  if (Number(thread.user_id) === Number(session.userId)) return thread;
  return false;
}

async function emitMessage(io, thread, message, adminId) {
  const formattedMessage = formatMessage(message);
  const conversationRow = await getConversationForThread(thread.id, adminId || thread.admin_id || message.sender_id);
  const formattedConversation = formatConversation(conversationRow || { ...thread, unread_count: 0 });

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

function initializeChatSocket(httpServer, sessionMiddleware) {
  const io = new Server(httpServer);

  io.engine.use(sessionMiddleware);

  io.use((socket, next) => {
    const session = socket.request.session;

    if (!session || !session.userId) {
      return next(new Error('Unauthorized'));
    }

    return next();
  });

  io.on('connection', async (socket) => {
    const session = socket.request.session;
    const userId = Number(session.userId);
    const adminId = await ChatModel.getAdminUserId();

    socket.join(`user:${userId}`);

    try {
      if (isAdminSession(session)) {
        socket.join('admins');
        const conversations = await ChatModel.listConversationsForAdmin(userId);
        socket.emit('chat:conversations', {
          conversations: conversations.map(formatConversation),
        });
      } else {
        const thread = await ChatModel.getOrCreateThreadForUser(userId, adminId);
        socket.join(`thread:${thread.id}`);
        const messages = await ChatModel.listMessages(thread.id);
        const unreadCount = await ChatModel.getUnreadCount(thread.id, userId);

        socket.emit('chat:ready', {
          conversation: formatConversation({ ...thread, unread_count: unreadCount }),
          messages: messages.map(formatMessage),
        });
      }
    } catch (err) {
      console.error('Socket chat init error:', err);
      socket.emit('chat:error', {
        message: 'Gagal memuat data chat.',
      });
    }

    socket.on('chat:join', async (payload = {}, callback) => {
      try {
        const threadId = payload.thread_id || payload.conversation_id;
        const thread = await canAccessThread(session, threadId);

        if (thread === null) {
          return socketAck(callback, {
            success: false,
            message: 'Percakapan tidak ditemukan.',
          });
        }

        if (thread === false) {
          return socketAck(callback, {
            success: false,
            message: 'Tidak boleh mengakses percakapan ini.',
          });
        }

        socket.join(`thread:${thread.id}`);
        const messages = await ChatModel.listMessages(thread.id, payload.limit);

        return socketAck(callback, {
          success: true,
          conversation: formatConversation(thread),
          messages: messages.map(formatMessage),
        });
      } catch (err) {
        console.error('Socket chat join error:', err);
        return socketAck(callback, {
          success: false,
          message: 'Gagal membuka percakapan.',
        });
      }
    });

    socket.on('chat:message', async (payload = {}, callback) => {
      try {
        const messageText = String(payload.message_text || payload.message || '').trim();

        if (!messageText) {
          return socketAck(callback, {
            success: false,
            message: 'Pesan tidak boleh kosong.',
          });
        }

        let thread;
        if (isAdminSession(session)) {
          const threadId = payload.thread_id || payload.conversation_id;
          thread = await canAccessThread(session, threadId);

          if (!thread) {
            return socketAck(callback, {
              success: false,
              message: thread === null ? 'Percakapan tidak ditemukan.' : 'Tidak boleh mengakses percakapan ini.',
            });
          }

          thread = await ChatModel.assignAdmin(thread.id, userId);
        } else {
          thread = await ChatModel.getOrCreateThreadForUser(userId, adminId);
        }

        socket.join(`thread:${thread.id}`);

        const message = await ChatModel.createMessage({
          threadId: thread.id,
          senderId: userId,
          messageText,
        });

        await emitMessage(io, thread, message, adminId || userId);

        return socketAck(callback, {
          success: true,
          conversation: formatConversation(thread),
          message: formatMessage(message),
        });
      } catch (err) {
        console.error('Socket chat message error:', err);
        return socketAck(callback, {
          success: false,
          message: 'Gagal mengirim pesan.',
        });
      }
    });

    socket.on('chat:read', async (payload = {}, callback) => {
      try {
        const threadId = payload.thread_id || payload.conversation_id;
        const thread = await canAccessThread(session, threadId);

        if (!thread) {
          return socketAck(callback, {
            success: false,
            message: thread === null ? 'Percakapan tidak ditemukan.' : 'Tidak boleh mengakses percakapan ini.',
          });
        }

        const affectedRows = await ChatModel.markThreadRead(thread.id, userId);

        if (affectedRows > 0) {
          io.to(`thread:${thread.id}`).emit('chat:read', {
            thread_id: thread.id,
            reader_id: userId,
          });
          io.to('admins').emit('chat:conversation_read', {
            thread_id: thread.id,
            reader_id: userId,
          });
        }

        return socketAck(callback, {
          success: true,
          affected_rows: affectedRows,
        });
      } catch (err) {
        console.error('Socket chat read error:', err);
        return socketAck(callback, {
          success: false,
          message: 'Gagal menandai pesan dibaca.',
        });
      }
    });
  });

  return io;
}

module.exports = {
  initializeChatSocket,
};
