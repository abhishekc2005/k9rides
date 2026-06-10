const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verifyLogin() {
  try {
    await mongoose.connect(MONGODB_URI);
    const adminCollection = mongoose.connection.collection('admins');
    
    console.log('Simulating login request to /admin/login for email: admin7@gmail.com');
    
    // Step 1: Find admin by email
    const adminDoc = await adminCollection.findOne({ email: 'admin7@gmail.com' });
    if (!adminDoc) {
      console.log('Login Failed: Admin not found');
      return;
    }
    console.log('Admin found in collection "admins":', adminDoc._id);
    
    // Step 2: Compare password using bcrypt, identical to admin.model.js comparePassword method
    const passwordAttempt = 'admin@1234';
    const isMatch = await bcrypt.compare(passwordAttempt, adminDoc.password);
    
    if (isMatch) {
      console.log('Login Successful: Password matched successfully!');
    } else {
      console.log('Login Failed: Incorrect password');
    }
    
  } catch (err) {
    console.error('Error verifying login:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

verifyLogin();
