const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function test() {
  try {
    const userCount = await db.user.count();
    console.log('Database connected! User count:', userCount);
    const users = await db.user.findMany({ select: { id: true, email: true, name: true } });
    console.log('Users:', users);
    const domainCount = await db.domain.count();
    console.log('Domain count:', domainCount);
    process.exit(0);
  } catch (err) {
    console.error('Database connection test failed:', err);
    process.exit(1);
  }
}

test();
