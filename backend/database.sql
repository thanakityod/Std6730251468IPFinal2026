-- SQL Script for Database: ip_std6730251468
-- phpMyAdmin URL: http://119.59.102.161/nindamdb/index.php?route=/database/structure&db=ip_std6730251468

CREATE DATABASE IF NOT EXISTS `ip_std6730251468`;
USE `ip_std6730251468`;

-- Table structure for table `employees`
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `position` VARCHAR(100) NOT NULL,
  `status` ENUM('Active', 'On Leave') NOT NULL DEFAULT 'Active',
  `salary` DECIMAL(10, 2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping initial mock data for table `employees` (6 initial employees across 3 salary tiers)
INSERT INTO `employees` (`id`, `name`, `position`, `status`, `salary`) VALUES
(1, 'John Doe', 'Software Engineer', 'Active', 45000.00),
(2, 'Jane Smith', 'Senior Project Manager', 'Active', 58000.00),
(3, 'Bob Johnson', 'Junior QA Specialist', 'Active', 22000.00),
(4, 'Alice Williams', 'UI/UX Designer', 'On Leave', 42000.00),
(5, 'Charlie Brown', 'VP of Engineering', 'Active', 95000.00),
(6, 'David Miller', 'IT Support Technician', 'Active', 19000.00);
