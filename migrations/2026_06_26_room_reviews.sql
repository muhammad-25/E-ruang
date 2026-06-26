-- Rating dan ulasan ruangan.

CREATE TABLE IF NOT EXISTS `room_reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` bigint(20) NOT NULL,
  `room_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` tinyint unsigned NOT NULL,
  `comment` text NOT NULL,
  `is_visible` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_room_reviews_booking` (`booking_id`),
  KEY `idx_room_reviews_room_visible` (`room_id`,`is_visible`,`created_at`),
  KEY `idx_room_reviews_user` (`user_id`),
  CONSTRAINT `room_reviews_booking_fk` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `room_reviews_room_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `room_reviews_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
