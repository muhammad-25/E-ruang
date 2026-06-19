-- Minimal, idempotent chat migration for E-Ruang.
-- Chat is intentionally independent from bookings.

CREATE TABLE IF NOT EXISTS `chat_threads` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `last_message_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_chat_threads_user` (`user_id`),
  KEY `idx_chat_threads_admin` (`admin_id`),
  KEY `idx_chat_threads_status` (`status`),
  KEY `idx_chat_threads_last_message` (`last_message_at`),
  CONSTRAINT `chat_threads_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chat_threads_admin_fk` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `chat_threads`
  ADD COLUMN IF NOT EXISTS `last_message_at` datetime DEFAULT NULL AFTER `status`;

CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `thread_id` bigint(20) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `message_text` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_thread_time` (`thread_id`,`created_at`),
  KEY `idx_chat_messages_sender` (`sender_id`),
  KEY `idx_chat_messages_unread` (`thread_id`,`is_read`,`created_at`),
  CONSTRAINT `chat_messages_thread_fk` FOREIGN KEY (`thread_id`) REFERENCES `chat_threads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chat_messages_sender_fk` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
