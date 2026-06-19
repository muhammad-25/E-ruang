function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function formatMessage(row) {
  if (!row) return null;

  return {
    id: row.id,
    thread_id: row.thread_id,
    sender_id: row.sender_id,
    sender_role_id: row.sender_role_id,
    sender_name: row.sender_name,
    sender_type: Number(row.sender_role_id) === 1 ? 'admin' : 'user',
    message_text: row.message_text,
    is_read: Boolean(row.is_read),
    read_at: toIso(row.read_at),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

function formatConversation(row) {
  if (!row) return null;

  return {
    id: row.id,
    thread_id: row.id,
    user_id: row.user_id,
    admin_id: row.admin_id,
    status: row.status,
    user_name: row.user_name,
    user_email: row.user_email,
    user_nim: row.user_nim,
    admin_name: row.admin_name,
    last_message_text: row.last_message_text || null,
    last_sender_id: row.last_sender_id || null,
    last_message_at: toIso(row.last_message_at || row.last_message_created_at || row.updated_at || row.created_at),
    last_message_created_at: toIso(row.last_message_created_at),
    unread_count: Number(row.unread_count || 0),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

module.exports = {
  formatConversation,
  formatMessage,
};
