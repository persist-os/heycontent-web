import { prisma } from '@/lib/db'

async function main() {
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: 'password123',  // In production, this should be hashed
      name: 'Test User'
    }
  })
  console.log('Created test user:', user)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 