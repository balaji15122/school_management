require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const School = require('./src/models/School');
const User = require('./src/models/User');
const StudentRecord = require('./src/models/StudentRecord');
const ExportHistory = require('./src/models/ExportHistory');

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Cleaning old database collections...');

    await Promise.all([
      School.deleteMany({}),
      User.deleteMany({}),
      StudentRecord.deleteMany({}),
      ExportHistory.deleteMany({}),
    ]);

    console.log('[Seed] Creating Super Admin user...');
    const superAdmin = await User.create({
      name: 'Super Platform Admin',
      email: 'admin@platform.com',
      phone: '+1 555-0199',
      passwordHash: 'admin123',
      role: 'super_admin',
      schoolId: null,
    });

    console.log('[Seed] Creating Schools and School Admins...');

    // School 1 - Greenwood High
    const school1 = await School.create({
      name: 'Greenwood High International',
      code: 'GWH2026',
      address: '742 Evergreen Terrace, Springfield',
      contactEmail: 'contact@greenwood.edu',
      contactPhone: '+1 555-0101',
    });

    const adminSchool1 = await User.create({
      name: 'Sarah Jenkins (Principal)',
      email: 'admin@greenwood.edu',
      phone: '+1 555-0102',
      passwordHash: 'password123',
      role: 'school_admin',
      schoolId: school1._id,
    });

    school1.adminUserId = adminSchool1._id;
    await school1.save();

    // School 2 - St. Xavier's
    const school2 = await School.create({
      name: "St. Xavier's Model Academy",
      code: 'SXA2026',
      address: '108 Beacon Hill Road, Boston',
      contactEmail: 'contact@stxaviers.edu',
      contactPhone: '+1 555-0201',
    });

    const adminSchool2 = await User.create({
      name: 'Father Robert Davis',
      email: 'admin@stxaviers.edu',
      phone: '+1 555-0202',
      passwordHash: 'password123',
      role: 'school_admin',
      schoolId: school2._id,
    });

    school2.adminUserId = adminSchool2._id;
    await school2.save();

    // School 3 - Delhi Public Global
    const school3 = await School.create({
      name: 'Delhi Public Global School',
      code: 'DPS2026',
      address: 'Plot 45, Sector 18, Cyber City',
      contactEmail: 'contact@dpsglobal.edu',
      contactPhone: '+91 98765-43210',
    });

    const adminSchool3 = await User.create({
      name: 'Dr. Rajesh Sharma',
      email: 'admin@dpsglobal.edu',
      phone: '+91 98765-43211',
      passwordHash: 'password123',
      role: 'school_admin',
      schoolId: school3._id,
    });

    school3.adminUserId = adminSchool3._id;
    await school3.save();

    // School 4 - Little Flower
    const school4 = await School.create({
      name: 'Little Flower Polytechnic',
      code: 'LFP2026',
      address: 'Main Campus Road, Tech Zone',
      contactEmail: 'admin@littleflower.edu',
      contactPhone: '+91 98765-01234',
    });

    const adminSchool4 = await User.create({
      name: 'Sister Mary Teresa (Director)',
      email: 'admin@littleflower.edu',
      phone: '+91 98765-01235',
      passwordHash: 'password123',
      role: 'school_admin',
      schoolId: school4._id,
    });

    school4.adminUserId = adminSchool4._id;
    await school4.save();

    console.log('[Seed] Generating realistic Student Records across schools...');

    const sampleStudentsGWH = [
      { name: 'Liam Johnson', adm: 'GWH-101', roll: '01', cls: 'Grade 10', sec: 'A', g: 'male', dob: '2010-04-12', bg: 'O+', session: '2026–27', st: 'verified' },
      { name: 'Olivia Smith', adm: 'GWH-102', roll: '02', cls: 'Grade 10', sec: 'A', g: 'female', dob: '2010-08-22', bg: 'A+', session: '2026–27', st: 'verified' },
      { name: 'Noah Brown', adm: 'GWH-103', roll: '03', cls: 'Grade 10', sec: 'B', g: 'male', dob: '2010-01-15', bg: 'B+', session: '2026–27', st: 'forwarded' },
      { name: 'Emma Wilson', adm: 'GWH-104', roll: '01', cls: 'Grade 9', sec: 'A', g: 'female', dob: '2011-06-30', bg: 'AB+', session: '2026–27', st: 'verified' },
      { name: 'James Taylor', adm: 'GWH-105', roll: '02', cls: 'Grade 9', sec: 'B', g: 'male', dob: '2011-11-05', bg: 'O-', session: '2026–27', st: 'rejected', rej: 'Photo not clear' },
      { name: 'Sophia Martinez', adm: 'GWH-106', roll: '01', cls: 'Grade 11', sec: 'A', g: 'female', dob: '2009-03-18', bg: 'A-', session: '2026–27', st: 'verified' },
      { name: 'Lucas Anderson', adm: 'GWH-107', roll: '02', cls: 'Grade 11', sec: 'B', g: 'male', dob: '2009-09-09', bg: 'B-', session: '2026–27', st: 'forwarded' },
      { name: 'Mia Thomas', adm: 'GWH-108', roll: '01', cls: 'Grade 12', sec: 'A', g: 'female', dob: '2008-05-25', bg: 'O+', session: '2026–27', st: 'verified' },
      { name: 'Ethan White', adm: 'GWH-109', roll: '02', cls: 'Grade 12', sec: 'B', g: 'male', dob: '2008-12-14', bg: 'AB-', session: '2026–27', st: 'verified' },
      { name: 'Isabella Harris', adm: 'GWH-110', roll: '01', cls: 'Grade 8', sec: 'A', g: 'female', dob: '2012-07-19', bg: 'A+', session: '2026–27', st: 'forwarded' },
    ];

    const sampleStudentsSXA = [
      { name: 'Alexander Wright', adm: 'SXA-201', roll: '01', cls: 'Grade 10', sec: 'A', g: 'male', dob: '2010-05-14', bg: 'O+', session: '2026–27', st: 'verified' },
      { name: 'Grace Hall', adm: 'SXA-202', roll: '02', cls: 'Grade 10', sec: 'B', g: 'female', dob: '2010-09-03', bg: 'A+', session: '2026–27', st: 'verified' },
      { name: 'Daniel Young', adm: 'SXA-203', roll: '01', cls: 'Grade 9', sec: 'A', g: 'male', dob: '2011-03-21', bg: 'B+', session: '2026–27', st: 'forwarded' },
      { name: 'Ava Allen', adm: 'SXA-204', roll: '02', cls: 'Grade 9', sec: 'B', g: 'female', dob: '2011-07-11', bg: 'O+', session: '2026–27', st: 'verified' },
      { name: 'Henry King', adm: 'SXA-205', roll: '01', cls: 'Grade 11', sec: 'A', g: 'male', dob: '2009-04-04', bg: 'AB+', session: '2026–27', st: 'rejected', rej: 'Roll number conflict' },
      { name: 'Ella Scott', adm: 'SXA-206', roll: '02', cls: 'Grade 11', sec: 'B', g: 'female', dob: '2009-12-01', bg: 'A-', session: '2026–27', st: 'verified' },
    ];

    const sampleStudentsDPS = [
      { name: 'Aarav Patel', adm: 'DPS-301', roll: '01', cls: 'Grade 10', sec: 'A', g: 'male', dob: '2010-01-20', bg: 'B+', session: '2026–27', st: 'verified' },
      { name: 'Ananya Sharma', adm: 'DPS-302', roll: '02', cls: 'Grade 10', sec: 'A', g: 'female', dob: '2010-06-15', bg: 'O+', session: '2026–27', st: 'verified' },
      { name: 'Vihaan Gupta', adm: 'DPS-303', roll: '03', cls: 'Grade 10', sec: 'B', g: 'male', dob: '2010-10-08', bg: 'A+', session: '2026–27', st: 'forwarded' },
      { name: 'Diya Verma', adm: 'DPS-304', roll: '01', cls: 'Grade 9', sec: 'A', g: 'female', dob: '2011-04-25', bg: 'O-', session: '2026–27', st: 'verified' },
    ];

    const sampleStudentsLFP = [
      { name: 'Rohan Deshmukh', adm: 'LFP-401', roll: '01', cls: 'Grade 10', sec: 'A', g: 'male', dob: '2010-03-11', bg: 'B+', session: '2026–27', st: 'verified' },
      { name: 'Pooja Hegde', adm: 'LFP-402', roll: '02', cls: 'Grade 10', sec: 'B', g: 'female', dob: '2010-07-19', bg: 'A+', session: '2026–27', st: 'verified' },
      { name: 'Aditya Roy', adm: 'LFP-403', roll: '01', cls: 'Grade 11', sec: 'A', g: 'male', dob: '2009-08-25', bg: 'O+', session: '2026–27', st: 'forwarded' },
    ];

    const fs = require('fs');
    const path = require('path');
    const { savePhotoBuffer, sanitizeAdmissionNumber } = require('./src/utils/photoStorageHelper');

    // 1x1 transparent PNG sample buffer
    const samplePhotoBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const insertRecords = async (school, adminUser, list) => {
      const recordsToInsert = list.map((s) => {
        const cleanAdm = sanitizeAdmissionNumber(s.adm);
        const fileName = `${cleanAdm}.png`;

        // Save physical photo file in school folder and root uploads
        savePhotoBuffer({
          buffer: samplePhotoBuffer,
          ext: 'png',
          admissionNumber: s.adm,
          schoolCode: school.code,
        });

        return {
          schoolId: school._id,
          submittedBy: adminUser._id,
          name: s.name,
          photoUrl: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(s.name)}`,
          photoFileName: fileName,
          admissionNumber: s.adm,
          class: s.cls,
          section: s.sec,
          rollNumber: s.roll,
          dob: new Date(s.dob),
          gender: s.g,
          bloodGroup: s.bg,
          academicSession: s.session || '2026–27',
          status: s.st,
          forwardedAt: new Date(),
          rejectionReason: s.rej || '',
          verifiedBy: s.st === 'verified' ? superAdmin._id : null,
          verifiedAt: s.st === 'verified' ? new Date() : null,
        };
      });

      await StudentRecord.insertMany(recordsToInsert);
    };

    await insertRecords(school1, adminSchool1, sampleStudentsGWH);
    await insertRecords(school2, adminSchool2, sampleStudentsSXA);
    await insertRecords(school3, adminSchool3, sampleStudentsDPS);
    await insertRecords(school4, adminSchool4, sampleStudentsLFP);

    console.log('[Seed] Database populated successfully!');
    console.log('----------------------------------------------------');
    console.log('Demo Credentials:');
    console.log('1. Super Admin:');
    console.log('   Email: admin@platform.com | Password: admin123');
    console.log('2. School 1 Admin (Greenwood High - Code: GWH2026):');
    console.log('   Email: admin@greenwood.edu | Password: password123');
    console.log("3. School 2 Admin (St. Xavier's - Code: SXA2026):");
    console.log('   Email: admin@stxaviers.edu | Password: password123');
    console.log('4. School 3 Admin (Delhi Public School - Code: DPS2026):');
    console.log('   Email: admin@dpsglobal.edu | Password: password123');
    console.log('5. School 4 Admin (Little Flower - Code: LFP2026):');
    console.log('   Email: admin@littleflower.edu | Password: password123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
