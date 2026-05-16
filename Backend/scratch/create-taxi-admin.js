import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { Admin } from '../src/modules/Taxi/admin/models/Admin.js';
import { hashPassword } from '../src/modules/Taxi/services/passwordService.js';

const createAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(config.mongodbUri);
        console.log('Connected.');

        const email = 'Eqosyindia@gmail.com'.toLowerCase();
        const password = 'sahin.eqosy@2004#';

        console.log(`Hashing password for ${email}...`);
        const hashedPassword = await hashPassword(password);

        let admin = await Admin.findOne({ email });

        if (admin) {
            console.log('Admin already exists. Updating password...');
            admin.password = hashedPassword;
            admin.name = 'Eqosy India';
            admin.admin_type = 'superadmin';
            admin.role = 'superadmin';
            admin.active = true;
            admin.status = 'active';
            await admin.save();
            console.log('Admin updated successfully.');
        } else {
            console.log('Creating new Admin...');
            admin = await Admin.create({
                name: 'Eqosy India',
                email,
                password: hashedPassword,
                admin_type: 'superadmin',
                role: 'superadmin',
                active: true,
                status: 'active',
                permissions: ['*'] // Give all permissions
            });
            console.log('Admin created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
