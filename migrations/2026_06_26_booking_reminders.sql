-- Minimal, idempotent reminder log migration for E-Ruang.

CREATE TABLE IF NOT EXISTS `booking_reminders` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `booking_id` BIGINT(20) NOT NULL,
  `reminder_type` VARCHAR(30) NOT NULL,
  `status` ENUM('sent','failed') NOT NULL DEFAULT 'sent',
  `message` TEXT DEFAULT NULL,
  `error_message` TEXT DEFAULT NULL,
  `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_booking_reminders_once` (`booking_id`, `reminder_type`),
  KEY `idx_booking_reminders_booking` (`booking_id`),
  KEY `idx_booking_reminders_type` (`reminder_type`),
  CONSTRAINT `booking_reminders_booking_fk`
    FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
