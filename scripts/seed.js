require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const School   = require('../src/models/School');
const Branch   = require('../src/models/Branch');
const User     = require('../src/models/User');

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('\nERROR: MONGO_URI is not set in your .env file');
    console.error('1. Copy .env.example to .env');
    console.error('2. Set MONGO_URI=mongodb+srv://...\n');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected!\n');

  // School
  let school = await School.findOne({ slug: 'default' });
  if (!school) {
    school = await School.create({ name: 'Nritya Academy', slug: 'default', email: 'admin@nritya.com', phone: '9999999999' });
    console.log('✓ Created school:', school.name);
  } else {
    console.log('✓ School already exists:', school.name);
  }

  // Branch
  let branch = await Branch.findOne({ schoolId: school._id });
  if (!branch) {
    branch = await Branch.create({ schoolId: school._id, name: 'Main Branch', address: 'Thrissur, Kerala', phone: '9999999998' });
    console.log('✓ Created branch:', branch.name);
  } else {
    console.log('✓ Branch already exists:', branch.name);
  }

  // Super Admin
  if (!await User.findOne({ email: 'admin@nritya.com' })) {
    await User.create({ schoolId: school._id, name: 'Super Admin', email: 'admin@nritya.com', phone: '9999999999', password: 'Admin@1234', role: 'super_admin', isActive: true });
    console.log('✓ Created super admin    → admin@nritya.com / Admin@1234');
  } else {
    console.log('✓ Super admin already exists');
  }

  // Branch Manager
  if (!await User.findOne({ email: 'manager@nritya.com' })) {
    await User.create({ schoolId: school._id, branchId: branch._id, name: 'Branch Manager', email: 'manager@nritya.com', password: 'Manager@1234', role: 'branch_manager', isActive: true });
    console.log('✓ Created branch manager → manager@nritya.com / Manager@1234');
  } else {
    console.log('✓ Branch manager already exists');
  }

  // Teacher
  if (!await User.findOne({ email: 'teacher@nritya.com' })) {
    const t = await User.create({ schoolId: school._id, branchId: branch._id, name: 'Meera Nair', email: 'teacher@nritya.com', phone: '9888888888', password: 'Teacher@1234', role: 'teacher', isActive: true });
    await Branch.findByIdAndUpdate(branch._id, { managerId: t._id });
    console.log('✓ Created teacher        → teacher@nritya.com / Teacher@1234');
  } else {
    console.log('✓ Teacher already exists');
  }

  // Student
  if (!await User.findOne({ email: 'student@nritya.com' })) {
    await User.create({ schoolId: school._id, branchId: branch._id, name: 'Priya Krishnan', email: 'student@nritya.com', phone: '9777777777', password: 'Student@1234', role: 'student', isActive: true });
    console.log('✓ Created student        → student@nritya.com / Student@1234');
  } else {
    console.log('✓ Student already exists');
  }

  console.log('\n✅ Seed complete! Run: node server.js');
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
