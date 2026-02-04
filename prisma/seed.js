const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@pixwarm.com';
    const adminPassword = 'adminpassword123'; // User should change this after first login

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            password: adminPassword,
            name: 'Admin User',
            role: 'ADMIN',
            emailVerified: true
        },
    });

    console.log('✅ Admin user created/verified:', admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
