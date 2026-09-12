-- E-Kantin Smart Order - MySQL schema for phpMyAdmin
CREATE DATABASE IF NOT EXISTS ekantin_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE ekantin_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menus;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(120) NOT NULL,
  saldo_emoney DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE menus (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  kategori VARCHAR(80) NOT NULL,
  harga DECIMAL(12, 2) NOT NULL,
  stok INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_menu_harga CHECK (harga >= 0),
  CONSTRAINT chk_menu_stok CHECK (stok >= 0)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  total_harga DECIMAL(12, 2) NOT NULL,
  metode_pembayaran ENUM('E-Money', 'Tunai') NOT NULL,
  status ENUM('Menunggu', 'Diproses', 'Selesai', 'Dibatalkan') NOT NULL DEFAULT 'Menunggu',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_orders_created_at (created_at),
  INDEX idx_orders_status (status)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  menu_id INT UNSIGNED NOT NULL,
  kuantitas INT NOT NULL,
  harga_satuan DECIMAL(12, 2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_menu FOREIGN KEY (menu_id) REFERENCES menus(id),
  CONSTRAINT chk_order_item_quantity CHECK (kuantitas > 0)
) ENGINE=InnoDB;

INSERT INTO users (nama, saldo_emoney) VALUES
  ('Budi Santoso', 150000.00),
  ('Siti Aminah', 85000.00),
  ('Andi Wijaya', 200000.00);

INSERT INTO menus (nama, kategori, harga, stok) VALUES
  ('Nasi Goreng Spesial', 'Makanan', 18000.00, 24),
  ('Ayam Geprek Sambal Matah', 'Makanan', 22000.00, 18),
  ('Mie Ayam Bakso', 'Makanan', 16000.00, 30),
  ('Es Teh Manis', 'Minuman', 5000.00, 50),
  ('Jus Alpukat', 'Minuman', 12000.00, 15),
  ('Pisang Cokelat', 'Snack', 10000.00, 20);

-- Contoh pesanan agar dashboard langsung memiliki data untuk diuji.
INSERT INTO orders (user_id, total_harga, metode_pembayaran, status) VALUES
  (1, 28000.00, 'E-Money', 'Menunggu'),
  (2, 22000.00, 'Tunai', 'Diproses'),
  (3, 17000.00, 'E-Money', 'Selesai');

INSERT INTO order_items (order_id, menu_id, kuantitas, harga_satuan) VALUES
  (1, 1, 1, 18000.00), (1, 4, 2, 5000.00),
  (2, 2, 1, 22000.00),
  (3, 3, 1, 16000.00), (3, 4, 1, 5000.00);
