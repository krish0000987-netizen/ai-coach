const { db } = require('./src/lib/db');

async function test() {
  try {
    const userCount = await db.user.count();
    console.log('Database connected! User count:', userCount);
    const domainCount = await db.domain.count();
    console.log('Domain count:', domainCount);
    process.exit(0);
  } catch (err) {
    console.error('Database connection test failed:', err);
    process.exit(1);
  }
}

test();
