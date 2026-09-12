const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ekantin_db',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

app.use(cors());
app.use(express.json());

// Endpoint to fetch all menus
app.get('/api/menu', async (req, res) => {
  try {
    const [menus] = await pool.query(
      'SELECT id, nama AS name, kategori AS category, harga AS price, stok AS stock FROM menus ORDER BY id DESC',
    );
    res.json(menus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil menu', detail: error.message });
  }
});

app.get('/api/user', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, nama AS name, saldo_emoney AS emoneyBalance FROM users ORDER BY id LIMIT 1');
    res.json(users[0] || null);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil user', detail: error.message });
  }
});

app.post('/api/order', async (req, res) => {
  const { userId, items, paymentMethod, totalAmount } = req.body;
  if (!userId || !Array.isArray(items) || !items.length) return res.status(400).json({ message: 'Pesanan tidak boleh kosong' });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [userRows] = await connection.execute('SELECT id, saldo_emoney FROM users WHERE id = ? FOR UPDATE', [userId]);
    if (!userRows.length) throw new Error('User tidak ditemukan');
    if (paymentMethod === 'E-Money' && Number(userRows[0].saldo_emoney) < Number(totalAmount)) throw new Error('Saldo E-Money tidak mencukupi');
    for (const item of items) {
      const [menuRows] = await connection.execute('SELECT stok FROM menus WHERE id = ? FOR UPDATE', [item.menuId]);
      if (!menuRows.length || menuRows[0].stok < item.quantity) throw new Error('Stok menu tidak mencukupi');
      await connection.execute('UPDATE menus SET stok = stok - ? WHERE id = ?', [item.quantity, item.menuId]);
    }
    if (paymentMethod === 'E-Money') await connection.execute('UPDATE users SET saldo_emoney = saldo_emoney - ? WHERE id = ?', [totalAmount, userId]);
    const [orderResult] = await connection.execute('INSERT INTO orders (user_id, total_harga, metode_pembayaran, status) VALUES (?, ?, ?, ?)', [userId, totalAmount, paymentMethod, 'Menunggu']);
    for (const item of items) await connection.execute('INSERT INTO order_items (order_id, menu_id, kuantitas, harga_satuan) VALUES (?, ?, ?, ?)', [orderResult.insertId, item.menuId, item.quantity, item.price]);
    await connection.commit();
    res.status(201).json({ message: 'Pesanan berhasil dibuat', orderId: orderResult.insertId });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ message: error.message || 'Checkout gagal' });
  } finally { connection.release(); }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const [[stats]] = await pool.query(`
      SELECT
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) AS totalPesananHariIni,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() AND status <> 'Dibatalkan' THEN total_harga ELSE 0 END), 0) AS totalPendapatan
      FROM orders
    `);
    res.json({
      totalOrdersToday: Number(stats.totalPesananHariIni),
      totalRevenue: Number(stats.totalPendapatan),
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil statistik', detail: error.message });
  }
});

app.get('/api/admin/orders', async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.id, o.total_harga AS totalAmount, o.metode_pembayaran AS paymentMethod,
        o.status, o.created_at AS createdAt, u.nama AS customerName,
        GROUP_CONCAT(CONCAT(oi.kuantitas, 'x ', m.nama) ORDER BY m.nama SEPARATOR ', ') AS items
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN menus m ON m.id = oi.menu_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 100
    `);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil pesanan', detail: error.message });
  }
});

app.patch('/api/admin/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['Menunggu', 'Diproses', 'Selesai', 'Dibatalkan'];
  if (!allowedStatuses.includes(status)) return res.status(400).json({ message: 'Status tidak valid' });
  try {
    const [result] = await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    res.json({ message: 'Status pesanan diperbarui' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui status', detail: error.message });
  }
});

app.post('/api/admin/menus', async (req, res) => {
  const { name, category, price, stock } = req.body;
  if (!name || !category || Number(price) < 0 || Number(stock) < 0) {
    return res.status(400).json({ message: 'Nama, kategori, harga, dan stok wajib valid' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO menus (nama, kategori, harga, stok) VALUES (?, ?, ?, ?)',
      [name.trim(), category.trim(), Number(price), Number(stock)],
    );
    res.status(201).json({ id: result.insertId, name, category, price: Number(price), stock: Number(stock) });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambah menu', detail: error.message });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected', detail: error.message });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
