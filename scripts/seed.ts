import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create default users
  const hashedPassword = await bcrypt.hash('password123', 10)

  const users = [
    {
      email: 'bride@wedding.com',
      password: hashedPassword,
      role: 'bride',
      name: 'Bride'
    },
    {
      email: 'brother@wedding.com',
      password: hashedPassword,
      role: 'brother',
      name: 'Brother'
    },
    {
      email: 'father@wedding.com',
      password: hashedPassword,
      role: 'father',
      name: 'Father'
    },
    {
      email: 'mother@wedding.com',
      password: hashedPassword,
      role: 'mother',
      name: 'Mother'
    }
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user
    })
  }

  console.log('Seeded default users')
  console.log('All users have password: password123')

  // Create predefined groups
  const predefinedGroups = [
    { name: 'adnan', isPredefined: true },
    { name: 'tasneem', isPredefined: true },
    { name: 'zahra', isPredefined: true },
    { name: 'khozema', isPredefined: true },
    { name: 'dada&dadi', isPredefined: true }
  ]

  for (const group of predefinedGroups) {
    await prisma.group.upsert({
      where: { name: group.name },
      update: { isPredefined: true }, // Ensure they remain predefined
      create: group
    })
  }

  console.log('Seeded predefined groups: adnan, tasneem, zahra, khozema, dada&dadi')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

