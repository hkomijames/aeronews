import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt'; // 👈 Import bcrypt directly here
import "dotenv/config"; 

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 Syncing user administration profiles with live runtime hashing...');

  // Generate the hash fresh on your CPU right now to guarantee 100% text accuracy
  const securePasswordHash = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD || 'default_dev_password', 10);

  // 1. Check if the old admin account profile exists
  const oldAdminExists = await prisma.user.findUnique({
    where: { email: 'editor@avnews.com' }
  });

  let author;

  if (oldAdminExists) {
    author = await prisma.user.update({
      where: { email: 'editor@avnews.com' },
      data: {
        email: 'hiheglokomi1990@gmail.com', 
        name: 'Lawson James',               
        password: securePasswordHash, // 👈 Uses fresh live runtime hash
        role: 'ADMIN',
        title: 'Editor in Chief / Senior Technology Correspondent',
      }
    });
    console.log('🔄 Migrated existing admin profile to Lawson James.');
  } else {
    author = await prisma.user.upsert({
      where: { email: 'hiheglokomi1990@gmail.com' },
      update: {
        name: 'Lawson James',
        password: securePasswordHash, // 👈 Overwrites with fresh live runtime hash
        role: 'ADMIN',
      },
      create: {
        email: 'hiheglokomi1990@gmail.com',
        name: 'Lawson James',
        password: securePasswordHash, // 👈 Saves fresh live runtime hash
        title: 'Editor in Chief / Senior Technology Correspondent',
        bio: 'Lawson James is a seasoned technology journalist with over a decade of experience covering open-source development, full-stack frameworks, and serverless database systems.',
        avatarUrl: 'https://unsplash.com',
        sameAsLinks: ['https://linkedin.com', 'https://muckrack.com'],
        role: 'ADMIN',
      },
    });
    console.log('✅ Master Admin profile verified.');
  }

  // 2. Link test article
  await prisma.article.upsert({
    where: { slug: 'nextjs-local-postgres-success' },
    update: { authorId: author.id },
    create: {
      title: 'Local PostgreSQL Connection Proves Highly Successful',
      slug: 'nextjs-local-postgres-success',
      excerpt: 'Developers rejoice as the full-stack database connection layer for the new hybrid rendering system passes flawlessly on port 5432.',
      content: 'In a stunning turn of events, the local database sync passed cleanly on port 5432.',
      imageUrl: 'https://unsplash.com',
      category: 'Technology',
      isPublished: true,
      authorId: author.id,
    },
  });

  console.log('🌱 Database seeded with fresh dynamic bcrypt footprint successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
