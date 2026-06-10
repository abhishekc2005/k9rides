const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function createSystemAdmin() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Using the 'admins' collection as identified in admin.model.js
    const adminCollection = mongoose.connection.collection('admins');
    const existingAdmin = await adminCollection.findOne({ email: 'admin7@gmail.com' });
    
    if (existingAdmin) {
      console.log('System Admin already exists! (Email: admin7@gmail.com)');
      // Re-hash and force update password
      // The application's bcryptSaltRounds is usually 10.
      const newHash = await bcrypt.hash('admin@1234', 10);
      await adminCollection.updateOne(
        { email: 'admin7@gmail.com' }, 
        { $set: { password: newHash } }
      );
      console.log('Updated existing system admin password to: admin@1234');
      console.log('Document Details: ', await adminCollection.findOne({ email: 'admin7@gmail.com' }));
    } else {
      const hash = await bcrypt.hash('admin@1234', 10);
      const newAdmin = {
        email: 'admin7@gmail.com',
        password: hash,
        name: 'System Admin',
        phone: '9999999999',
        profileImage: '',
        fcmTokens: [],
        fcmTokenMobile: [],
        role: 'ADMIN',
        isActive: true,
        servicesAccess: ['food', 'quickCommerce', 'taxi'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await adminCollection.insertOne(newAdmin);
      console.log('Successfully created a new system admin account!');
      console.log('Email: admin7@gmail.com | Password: admin@1234');
      console.log('Collection used: admins');
      console.log('Document created:', newAdmin);
    }
  } catch (err) {
    console.error('Error creating admin:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createSystemAdmin();
