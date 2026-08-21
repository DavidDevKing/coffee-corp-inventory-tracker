import { prisma, pool } from '../src/config/db'
import { env } from '../src/config/env'
import bycrypt from 'bcryptjs';





async function main() {
    const adminEmail = 'davedev.clone6@gmail.com';
    const temporaryPassowrd = 'DefaultPassword';

    // Check if an admin user already exists
    console.log('Checking for existing administrator accounts... ')

    const existingAdmin = await prisma.user.findUnique({
        where: {email : adminEmail},
    })

    if (existingAdmin) {
        console.log(`An administrator accout with email ${adminEmail} already exists. Skipping seed.`);
        return;
    }

    const hashedPassword = await bycrypt.hash(temporaryPassowrd, 12);
    
    // Create the admin user
    await prisma.user.create({
        data: {
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
            isActive: true,
        }
    })


    console.log('-'.repeat(50));
    console.log('Master administrator account successfully seeded!!!');
    console.log(`Email:     ${adminEmail}`);
    console.log(`Password:  ${temporaryPassowrd}`);
    console.log('-'.repeat(50));
}


main()
    .catch((e) =>{
        console.error('Seeding process failed:', e)
        process.exit(1);
    })
    .finally(async () =>{
        await prisma.$disconnect();
        await pool.end();
    })