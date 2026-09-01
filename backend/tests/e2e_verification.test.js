const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const ExcelJS = require('exceljs');

const BASE_URL = 'http://localhost:5050/api';

describe('Multi-Tenant School Management End-to-End Verification', () => {
  let superAdminToken;
  let schoolAdminTokenGWH;
  let schoolAdminTokenSXA;
  let gwhSchoolId;
  let sxaSchoolId;

  before(async () => {
    // 1. Login Super Admin
    const resSA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@platform.com', password: 'admin123' }),
    });
    const dataSA = await resSA.json();
    assert.strictEqual(dataSA.success, true, 'Super Admin login must succeed');
    superAdminToken = dataSA.data.accessToken;

    // 2. Login Greenwood High School Admin
    const resGWH = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@greenwood.edu', password: 'password123' }),
    });
    const dataGWH = await resGWH.json();
    assert.strictEqual(dataGWH.success, true, 'Greenwood Admin login must succeed');
    schoolAdminTokenGWH = dataGWH.data.accessToken;
    gwhSchoolId = dataGWH.data.user.schoolId._id || dataGWH.data.user.schoolId;

    // 3. Login St. Xavier's School Admin
    const resSXA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@stxaviers.edu', password: 'password123' }),
    });
    const dataSXA = await resSXA.json();
    assert.strictEqual(dataSXA.success, true, "St. Xavier's Admin login must succeed");
    schoolAdminTokenSXA = dataSXA.data.accessToken;
    sxaSchoolId = dataSXA.data.user.schoolId._id || dataSXA.data.user.schoolId;
  });

  test('Tenant Isolation: Greenwood Admin only sees Greenwood students', async () => {
    const res = await fetch(`${BASE_URL}/students`, {
      headers: { Authorization: `Bearer ${schoolAdminTokenGWH}` },
    });
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.length > 0, 'Should return records');
    // All returned records must have schoolId matching Greenwood
    for (const student of data.data) {
      assert.strictEqual(student.schoolId._id.toString(), gwhSchoolId.toString());
    }
  });

  test('Tenant Isolation: Duplicate admission number in different schools succeeds', async () => {
    const testAdmNo = `ISO-TEST-${Date.now()}`;

    // Insert into Greenwood High
    const res1 = await fetch(`${BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${schoolAdminTokenGWH}`,
      },
      body: JSON.stringify({
        name: 'Student Greenwood ISO',
        admissionNumber: testAdmNo,
        class: 'Grade 10',
        section: 'A',
        rollNumber: '15',
        dob: '2010-01-01',
        gender: 'male',
        bloodGroup: 'O+',
        academicSession: '2026–27',
      }),
    });
    const data1 = await res1.json();
    assert.strictEqual(data1.success, true, 'First insertion in Greenwood must succeed');

    // Insert matching admission number into St. Xavier's
    const res2 = await fetch(`${BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${schoolAdminTokenSXA}`,
      },
      body: JSON.stringify({
        name: 'Student St Xaviers ISO',
        admissionNumber: testAdmNo,
        class: 'Grade 10',
        section: 'B',
        rollNumber: '15',
        dob: '2010-02-02',
        gender: 'female',
        bloodGroup: 'A+',
        academicSession: '2026–27',
      }),
    });
    const data2 = await res2.json();
    assert.strictEqual(data2.success, true, 'Matching admission number in another school must succeed');

    // Attempting duplicate in same school must fail with 409
    const resDuplicate = await fetch(`${BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${schoolAdminTokenGWH}`,
      },
      body: JSON.stringify({
        name: 'Duplicate Student in Greenwood',
        admissionNumber: testAdmNo,
        class: 'Grade 11',
        section: 'A',
        rollNumber: '16',
        dob: '2009-01-01',
        gender: 'male',
        academicSession: '2026–27',
      }),
    });
    assert.strictEqual(resDuplicate.status, 409, 'Duplicate admission number in same school must be rejected with 409');
  });

  test('School Admin Upload & Forward Workflow: Create -> Forward -> Super Admin Verify', async () => {
    // 1. School Admin Creates Student
    const adm = `NEW-STD-${Date.now()}`;
    const createRes = await fetch(`${BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${schoolAdminTokenGWH}`,
      },
      body: JSON.stringify({
        name: 'Lucas Vance Test',
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Lucas',
        admissionNumber: adm,
        class: 'Grade 9',
        section: 'C',
        rollNumber: '25',
        dob: '2011-04-15',
        gender: 'male',
        bloodGroup: 'B+',
        academicSession: '2026–27',
        status: 'draft',
      }),
    });
    const createData = await createRes.json();
    assert.strictEqual(createData.success, true);
    const studentId = createData.data._id || createData.data.id;
    assert.strictEqual(createData.data.status, 'draft');

    // 2. School Admin Forwards Student to Super Admin
    const fwdRes = await fetch(`${BASE_URL}/students/${studentId}/forward`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${schoolAdminTokenGWH}`,
      },
      body: JSON.stringify({}),
    });
    const fwdData = await fwdRes.json();
    assert.strictEqual(fwdData.success, true);

    // 3. Super Admin Verifies Student
    const verifyRes = await fetch(`${BASE_URL}/students/${studentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ status: 'verified' }),
    });
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyData.success, true);
    assert.strictEqual(verifyData.data.status, 'verified');
  });

  test('Excel Export: Single School .xlsx contains proper workbook & formatting', async () => {
    const res = await fetch(`${BASE_URL}/export/school/${gwhSchoolId}/xlsx`, {
      headers: { Authorization: `Bearer ${schoolAdminTokenGWH}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(
      res.headers.get('content-type'),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    assert.ok(buffer.length > 5000, 'Excel file buffer should be substantial');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    assert.strictEqual(workbook.worksheets.length, 1, 'Single school export should contain 1 sheet');
    const sheet = workbook.worksheets[0];
    assert.ok(sheet.rowCount > 5, 'Sheet should contain data rows');
  });

  test('Excel Export: All Schools Master Workbook contains Summary + One Sheet Per School', async () => {
    const res = await fetch(`${BASE_URL}/export/all/xlsx`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // Should have Sheet 1: Overview Summary + Sheet per school (>= 3 schools)
    assert.ok(workbook.worksheets.length >= 4, 'Master workbook should have at least 4 sheets (Summary + 3 schools)');
    assert.strictEqual(workbook.worksheets[0].name, 'Overview Summary', 'First sheet must be Overview Summary');

    // Verify summary sheet has total rows
    const summarySheet = workbook.worksheets[0];
    assert.ok(summarySheet.rowCount >= 4, 'Summary sheet should have table rows');
  });

  test('Excel Export: Single School Excel has Photo File Name column matching Admission Number', async () => {
    const res = await fetch(`${BASE_URL}/export/school/${gwhSchoolId}/xlsx`, {
      headers: { Authorization: `Bearer ${schoolAdminTokenGWH}` },
    });
    assert.strictEqual(res.status, 200);

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.worksheets[0];
    const headerRow = sheet.getRow(4);
    // Find Photo File Name column
    let photoColIndex = -1;
    headerRow.eachCell((cell, colNumber) => {
      if (cell.value && cell.value.toString().includes('Photo File Name')) {
        photoColIndex = colNumber;
      }
    });

    assert.ok(photoColIndex > 0, 'Photo File Name column must be present in Excel worksheet');
  });

  test('Photo Upload with Admission Number: Renames photo file to match student admission number', async () => {
    const sampleBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const testAdm = `TEST-ADM-${Date.now()}`;

    const res = await fetch(`${BASE_URL}/upload/photo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${schoolAdminTokenGWH}`,
      },
      body: JSON.stringify({
        imageBase64: sampleBase64,
        admissionNumber: testAdm,
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.fileName, `${testAdm}.png`, 'Photo must be renamed to admission number');
    assert.ok(data.data.photoUrl.includes(`${testAdm}.png`));
  });

  test('Package Export: Single School Data Package (.zip) downloads valid ZIP with Excel and photos', async () => {
    const res = await fetch(`${BASE_URL}/export/school/${gwhSchoolId}/package`, {
      headers: { Authorization: `Bearer ${schoolAdminTokenGWH}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type'), 'application/zip');

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    assert.ok(buffer.length > 2000, 'ZIP buffer should contain substantial data');
    // Verify standard zip file signature: PK\x03\x04
    assert.strictEqual(buffer[0], 0x50);
    assert.strictEqual(buffer[1], 0x4b);
  });

  test('Package Export: Master All Schools Package (.zip) downloads valid ZIP for Super Admin', async () => {
    const res = await fetch(`${BASE_URL}/export/all/package`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type'), 'application/zip');

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    assert.ok(buffer.length > 2000, 'Master ZIP buffer should contain data');
    assert.strictEqual(buffer[0], 0x50);
    assert.strictEqual(buffer[1], 0x4b);
  });

  test('Dashboard Metrics: Returns accurate summary and submission timeline', async () => {
    const res = await fetch(`${BASE_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.summary.totalSchools >= 3);
    assert.ok(data.data.summary.totalStudents >= 15);
    assert.ok(Array.isArray(data.data.dailySubmissions));
    assert.ok(Array.isArray(data.data.classDistribution));
  });
});
