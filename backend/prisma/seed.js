const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Reset database for testing
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.menu.deleteMany({});
  await prisma.user.deleteMany({});

  // Create Dummy User
  const dummyUser = await prisma.user.create({
    data: {
      name: 'Budi Santoso (Siswa)',
      emoneyBalance: 150000,
    },
  });

  // Create Dummy Menu
  const menus = [
    { name: 'Nasi Goreng Spesial', category: 'Makanan', price: 15000, stock: 50 },
    { name: 'Mie Goreng Telur', category: 'Makanan', price: 12000, stock: 50 },
    { name: 'Ayam Geprek', category: 'Makanan', price: 18000, stock: 30 },
    { name: 'Es Teh Manis', category: 'Minuman', price: 5000, stock: 100 },
    { name: 'Es Jeruk', category: 'Minuman', price: 6000, stock: 80 },
    { name: 'Air Mineral', category: 'Minuman', price: 3000, stock: 100 },
    { name: 'Kerupuk Udang', category: 'Cemilan', price: 2000, stock: 200 },
    { name: 'Tempe Mendoan', category: 'Cemilan', price: 3000, stock: 100 }
  ];

  for (const menu of menus) {
    await prisma.menu.create({ data: menu });
  }

  console.log('Database has been seeded!');
  console.log('Dummy User ID:', dummyUser.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
