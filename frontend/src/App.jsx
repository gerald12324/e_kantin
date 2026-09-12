import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowUpRight, Check, ChevronDown, CircleDollarSign, ClipboardList, LayoutDashboard, Minus, PackagePlus, Plus, RefreshCw, ShoppingCart, Trash2, Utensils, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

function StatusBadge({ status }) {
  const styles = { Menunggu: 'bg-amber-50 text-amber-700 ring-amber-200', Diproses: 'bg-sky-50 text-sky-700 ring-sky-200', Selesai: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Dibatalkan: 'bg-rose-50 text-rose-700 ring-rose-200' };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status] || 'bg-gray-50 text-gray-600 ring-gray-200'}`}>{status}</span>;
}

function AdminApp() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [stats, setStats] = useState({ totalOrdersToday: 0, totalRevenue: 0 });
  const [orders, setOrders] = useState([]);
  const [menus, setMenus] = useState([]);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMenu, setNewMenu] = useState({ name: '', category: 'Makanan', price: '', stock: '' });

  const loadData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const [statsResponse, ordersResponse, menusResponse] = await Promise.all([axios.get(`${API_URL}/admin/stats`), axios.get(`${API_URL}/admin/orders`), axios.get(`${API_URL}/menu`)]);
      setStats(statsResponse.data);
      setOrders(ordersResponse.data);
      setMenus(menusResponse.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Backend belum terhubung. Jalankan server API terlebih dahulu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await axios.patch(`${API_URL}/admin/orders/${orderId}/status`, { status });
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Status pesanan gagal diperbarui.');
    }
  };

  const addMenu = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`${API_URL}/admin/menus`, { ...newMenu, price: Number(newMenu.price), stock: Number(newMenu.stock) });
      setNewMenu({ name: '', category: 'Makanan', price: '', stock: '' });
      setIsMenuModalOpen(false);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Menu gagal ditambahkan.');
    }
  };

  const menuItems = [{ label: 'Dashboard', icon: LayoutDashboard }, { label: 'Kelola Menu', icon: Utensils }, { label: 'Pesanan', icon: ClipboardList }];
  const pendingOrders = orders.filter((order) => order.status === 'Menunggu').length;

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#17211d]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-[#dce5df] bg-[#10251e] px-5 py-7 text-white lg:flex">
        <div className="mb-12 flex items-center gap-3 px-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8f36b] text-[#10251e]"><Utensils size={20} /></div><div><p className="font-bold tracking-tight">E-Kantin</p><p className="text-xs text-[#a8bdb3]">Smart Order</p></div></div>
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#779085]">Workspace</p>
        <nav className="space-y-1">{menuItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => setActivePage(label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${activePage === label ? 'bg-[#d8f36b] text-[#10251e]' : 'text-[#b8c9c0] hover:bg-white/10 hover:text-white'}`}><Icon size={18} />{label}{label === 'Pesanan' && pendingOrders > 0 && <span className="ml-auto rounded-full bg-[#f4a261] px-2 py-0.5 text-[10px] font-bold text-[#10251e]">{pendingOrders}</span>}</button>)}</nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-[#9bb1a6]">Status database</p><div className="mt-2 flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-[#d8f36b]" />MySQL terhubung</div></div>
      </aside>

      <main className="lg:ml-64">
        <header className="flex items-center justify-between border-b border-[#dce5df] bg-white/80 px-5 py-5 backdrop-blur md:px-10"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8f85]">Admin workspace</p><h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{activePage}</h1></div><div className="flex items-center gap-3"><button onClick={() => loadData(true)} title="Muat ulang data" className="rounded-xl border border-[#dce5df] p-2.5 text-[#527064] transition hover:bg-[#eef5ef]"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /></button><div className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#d8f36b] text-sm font-bold text-[#193127] sm:flex">AD</div><div className="hidden sm:block"><p className="text-sm font-semibold">Admin Kantin</p><p className="text-xs text-[#7a8f85]">Administrator</p></div><ChevronDown size={16} className="text-[#7a8f85]" /></div></header>
        <div className="px-5 py-7 md:px-10 md:py-9">
          {error && <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button onClick={() => setError('')}><X size={16} /></button></div>}
          {activePage === 'Kelola Menu' ? <MenuPage menus={menus} onAdd={() => setIsMenuModalOpen(true)} /> : <><div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="text-sm text-[#7a8f85]">Ringkasan operasional hari ini</p><h2 className="mt-1 text-xl font-bold">Selamat datang kembali, Admin.</h2></div><div className="flex items-center gap-2 text-xs text-[#7a8f85]"><span className="h-2 w-2 rounded-full bg-emerald-500" />Data diperbarui otomatis setiap 5 detik</div></div><section className="mb-9 grid gap-4 md:grid-cols-2"><StatCard label="Total Pesanan" value={stats.totalOrdersToday} suffix="pesanan hari ini" icon={ClipboardList} color="lime" /><StatCard label="Total Pendapatan" value={currency.format(stats.totalRevenue)} suffix="pendapatan hari ini" icon={CircleDollarSign} color="orange" /></section><section className="overflow-hidden rounded-2xl border border-[#dce5df] bg-white shadow-[0_10px_40px_rgba(37,62,48,0.05)]"><div className="flex flex-col justify-between gap-3 border-b border-[#edf1ee] px-5 py-5 md:flex-row md:items-center md:px-7"><div><h3 className="font-bold">Pesanan Masuk</h3><p className="mt-1 text-xs text-[#7a8f85]">Pantau dan proses pesanan pelanggan secara langsung.</p></div><button onClick={() => setActivePage('Pesanan')} className="flex items-center gap-2 self-start rounded-lg bg-[#edf5cf] px-3 py-2 text-xs font-bold text-[#385228] hover:bg-[#d8f36b]">Lihat semua <ArrowUpRight size={14} /></button></div><OrdersTable orders={activePage === 'Pesanan' ? orders : orders.slice(0, 5)} onUpdateStatus={updateStatus} /></section></>}
        </div>
      </main>

      {isMenuModalOpen && <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#10251e]/50 p-5 backdrop-blur-sm"><form onSubmit={addMenu} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold">Tambah Menu</h3><p className="mt-1 text-xs text-[#7a8f85]">Masukkan item baru ke katalog kantin.</p></div><button type="button" onClick={() => setIsMenuModalOpen(false)} className="rounded-lg p-2 hover:bg-[#f1f5f2]"><X size={18} /></button></div><div className="space-y-4"><Field label="Nama menu"><input required value={newMenu.name} onChange={(event) => setNewMenu({ ...newMenu, name: event.target.value })} /></Field><Field label="Kategori"><select value={newMenu.category} onChange={(event) => setNewMenu({ ...newMenu, category: event.target.value })}><option>Makanan</option><option>Minuman</option><option>Snack</option></select></Field><div className="grid grid-cols-2 gap-3"><Field label="Harga"><input required min="0" type="number" value={newMenu.price} onChange={(event) => setNewMenu({ ...newMenu, price: event.target.value })} /></Field><Field label="Stok"><input required min="0" type="number" value={newMenu.stock} onChange={(event) => setNewMenu({ ...newMenu, stock: event.target.value })} /></Field></div></div><button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#10251e] px-4 py-3 text-sm font-bold text-white hover:bg-[#214a3a]"><Plus size={17} />Simpan Menu</button></form></div>}
    </div>
  );
}

function StatCard({ label, value, suffix, icon: Icon, color }) {
  return <div className={`relative overflow-hidden rounded-2xl border p-6 ${color === 'lime' ? 'border-[#d8f36b] bg-[#d8f36b]' : 'border-[#f4a261]/30 bg-[#fff1e7]'}`}><div className="flex items-start justify-between"><div><p className="text-sm font-semibold opacity-70">{label}</p><p className="mt-4 text-3xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs font-medium opacity-60">{suffix}</p></div><div className={`rounded-xl p-3 ${color === 'lime' ? 'bg-[#10251e] text-[#d8f36b]' : 'bg-[#f4a261] text-[#5c2e13]'}`}><Icon size={21} /></div></div><div className="absolute -bottom-8 -right-5 h-28 w-28 rounded-full border-[16px] border-black/5" /></div>;
}

function OrdersTable({ orders, onUpdateStatus }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#fafcfb] text-[11px] uppercase tracking-wider text-[#7a8f85]"><tr><th className="px-7 py-3 font-semibold">Order ID</th><th className="px-4 py-3 font-semibold">Pelanggan</th><th className="px-4 py-3 font-semibold">Pesanan</th><th className="px-4 py-3 font-semibold">Total</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-7 py-3 text-right font-semibold">Aksi</th></tr></thead><tbody className="divide-y divide-[#edf1ee]">{orders.length === 0 ? <tr><td colSpan="6" className="px-7 py-12 text-center text-sm text-[#7a8f85]">Belum ada pesanan.</td></tr> : orders.map((order) => <tr key={order.id} className="transition hover:bg-[#fbfdfb]"><td className="px-7 py-4 font-bold text-[#527064]">#ORD-{String(order.id).padStart(4, '0')}</td><td className="px-4 py-4"><p className="font-semibold">{order.customerName}</p><p className="mt-1 text-xs text-[#99a9a0]">{order.paymentMethod}</p></td><td className="max-w-[230px] truncate px-4 py-4 text-[#527064]">{order.items || '-'}</td><td className="px-4 py-4 font-bold">{currency.format(order.totalAmount)}</td><td className="px-4 py-4"><StatusBadge status={order.status} /></td><td className="px-7 py-4 text-right">{order.status !== 'Selesai' && order.status !== 'Dibatalkan' ? <button onClick={() => onUpdateStatus(order.id, 'Selesai')} className="inline-flex items-center gap-1.5 rounded-lg bg-[#edf5cf] px-3 py-2 text-xs font-bold text-[#385228] hover:bg-[#d8f36b]"><Check size={14} />Selesaikan</button> : <span className="text-xs text-[#99a9a0]">Selesai diproses</span>}</td></tr>)}</tbody></table></div>;
}

function MenuPage({ menus, onAdd }) {
  return <section><div className="mb-6 flex items-end justify-between"><div><p className="text-sm text-[#7a8f85]">Katalog produk kantin</p><h2 className="mt-1 text-xl font-bold">Kelola Menu</h2></div><button onClick={onAdd} className="flex items-center gap-2 rounded-xl bg-[#10251e] px-4 py-3 text-sm font-bold text-white hover:bg-[#214a3a]"><Plus size={17} />Tambah Menu</button></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{menus.map((menu) => <div key={menu.id} className="rounded-2xl border border-[#dce5df] bg-white p-5 shadow-[0_10px_40px_rgba(37,62,48,0.04)]"><div className="flex items-start justify-between"><span className="rounded-full bg-[#edf5cf] px-2.5 py-1 text-xs font-semibold text-[#527064]">{menu.category}</span><PackagePlus size={18} className="text-[#91a69b" /></div><h3 className="mt-5 font-bold">{menu.name}</h3><div className="mt-4 flex items-end justify-between"><p className="font-bold text-[#4f7a2c]">{currency.format(menu.price)}</p><p className="text-xs text-[#7a8f85">Stok <b className="text-[#17211d">{menu.stock}</b></p></div></div>)}</div></section>;
}

function Field({ label, children }) {
  return <label className="block text-xs font-semibold text-[#527064]">{label}<span className="mt-1.5 block">{children}</span></label>;
}

function ClientApp() {
  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([axios.get(`${API_URL}/menu`), axios.get(`${API_URL}/user`)]).then(([menuResponse, userResponse]) => {
      setMenus(menuResponse.data);
      setUser(userResponse.data);
    }).catch(() => setMessage('Server belum terhubung. Silakan coba lagi.'));
  }, []);

  const addToCart = (menu) => setCart((current) => {
    const existing = current.find((item) => item.menuId === menu.id);
    return existing ? current.map((item) => item.menuId === menu.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { menuId: menu.id, name: menu.name, price: Number(menu.price), quantity: 1 }];
  });
  const changeQuantity = (menuId, amount) => setCart((current) => current.map((item) => item.menuId === menuId ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0));
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const checkout = async () => {
    if (!cart.length || !user) return;
    try {
      await axios.post(`${API_URL}/order`, { userId: user.id, items: cart, paymentMethod: 'E-Money', totalAmount: total });
      setCart([]);
      setMessage('Pesanan berhasil dibuat. Silakan tunggu di kantin.');
    } catch (requestError) { setMessage(requestError.response?.data?.message || 'Checkout gagal.'); }
  };

  return <div className="min-h-screen bg-[#f6f8f7] text-[#17211d]"><header className="flex items-center justify-between border-b border-[#dce5df] bg-[#10251e] px-5 py-5 text-white md:px-10"><div><p className="text-xl font-bold">E-Kantin Smart Order</p><p className="text-xs text-[#b8c9c0]">Pesan makanan tanpa antre panjang</p></div><div className="flex items-center gap-4"><a href="/admin" className="rounded-lg bg-[#d8f36b] px-3 py-2 text-xs font-bold text-[#10251e] transition hover:bg-white">Dashboard Admin</a><div className="text-right"><p className="text-sm">{user?.name || 'Siswa'}</p><p className="text-xs text-[#d8f36b]">Saldo: {currency.format(user?.emoneyBalance || 0)}</p></div></div></header><main className="mx-auto grid max-w-7xl gap-6 p-5 md:p-10 lg:grid-cols-[1fr_360px]">{message && <p className="rounded-xl bg-[#edf5cf] p-4 text-sm font-medium text-[#385228] lg:col-span-2">{message}</p>}<section><div className="mb-6"><p className="text-sm text-[#7a8f85]">Menu hari ini</p><h1 className="mt-1 text-3xl font-bold">Makan enak, tinggal klik.</h1></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{menus.map((menu) => <article key={menu.id} className="rounded-2xl border border-[#dce5df] bg-white p-5 shadow-sm"><span className="rounded-full bg-[#edf5cf] px-2.5 py-1 text-xs font-semibold text-[#527064]">{menu.category}</span><h2 className="mt-5 font-bold">{menu.name}</h2><p className="mt-2 text-sm text-[#7a8f85]">Stok: {menu.stock}</p><div className="mt-5 flex items-center justify-between"><b>{currency.format(menu.price)}</b><button disabled={!menu.stock} onClick={() => addToCart(menu)} className="rounded-lg bg-[#10251e] p-2 text-[#d8f36b] disabled:opacity-30" title="Tambah ke keranjang"><Plus size={18} /></button></div></article>)}</div></section><aside className="h-fit rounded-2xl border border-[#dce5df] bg-white p-5 shadow-sm lg:sticky lg:top-5"><h2 className="flex items-center gap-2 text-lg font-bold"><ShoppingCart size={19} />Keranjang</h2>{!cart.length ? <p className="py-12 text-center text-sm text-[#7a8f85]">Keranjang masih kosong.</p> : <><div className="my-5 space-y-3">{cart.map((item) => <div key={item.menuId} className="flex items-center justify-between gap-3 rounded-xl bg-[#f6f8f7] p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.name}</p><p className="text-xs text-[#7a8f85]">{currency.format(item.price)}</p></div><div className="flex items-center gap-2"><button onClick={() => changeQuantity(item.menuId, -1)} className="rounded bg-white p-1"><Minus size={14} /></button><span className="text-sm font-bold">{item.quantity}</span><button onClick={() => addToCart(item)} className="rounded bg-white p-1"><Plus size={14} /></button><button onClick={() => setCart((current) => current.filter((entry) => entry.menuId !== item.menuId))} className="p-1 text-rose-500"><Trash2 size={14} /></button></div></div>)}</div><div className="flex justify-between border-t border-[#edf1ee] pt-4 font-bold"><span>Total</span><span>{currency.format(total)}</span></div><button onClick={checkout} className="mt-5 w-full rounded-xl bg-[#d8f36b] px-4 py-3 text-sm font-bold text-[#10251e]">Bayar Sekarang</button></>}</aside></main></div>;
}

function App() {
  return window.location.pathname.startsWith('/admin') ? <AdminApp /> : <ClientApp />;
}

export default App;
