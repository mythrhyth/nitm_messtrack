import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // clear tables
  await prisma.user.deleteMany({});
  await prisma.leaveRecord.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.hostel.deleteMany({});
  await prisma.systemSetting.deleteMany({});

  // seed hostels
  const hostels = ["Girls Hostel", "Boys Hostel (Single Seater)", "Boys Hostel (Triple Seater)"];
  for (const h of hostels) {
    await prisma.hostel.create({ data: { name: h } });
  }

  // seed settings
  const settings = [
    { key: 'messFee', value: '25000' },
    { key: 'bf', value: '30' },
    { key: 'lu', value: '65' },
    { key: 'di', value: '65' },
  ];
  for (const s of settings) {
    await prisma.systemSetting.create({ data: s });
  }

  // hash admin password
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      password: adminPasswordHash,
      role: 'admin'
    }
  });

  const studentDOBHash = await bcrypt.hash('2003-06-15', 10);

  // seed students
  const students = [
    { rollNo:"B22ME001", name:"Arjun Sharma",    gender:"M", dept:"ME", hostel:"Boys Hostel (Single Seater)", room:"A-101", year:"2022-26", semester:"Spring 2026", messFee:25000, amountPaid:25000, refundEarned:1430, status:"Active",   email:"arjun@nitm.ac.in",   phone:"9876543210" },
    { rollNo:"B22CS042", name:"Priya Devi",       gender:"F", dept:"CS", hostel:"Girls Hostel", room:"B-205", year:"2022-26", semester:"Spring 2026", messFee:25000, amountPaid:25000, refundEarned:780,  status:"Active",   email:"priya@nitm.ac.in",   phone:"9876543211" },
    { rollNo:"B23EC015", name:"Rohit Thapa",      gender:"M", dept:"EC", hostel:"Boys Hostel (Triple Seater)", room:"C-312", year:"2023-27", semester:"Spring 2026", messFee:25000, amountPaid:20000, refundEarned:2210, status:"On Leave", email:"rohit@nitm.ac.in",   phone:"9876543212" },
    { rollNo:"B23CE028", name:"Sneha Borah",      gender:"F", dept:"CE", hostel:"Girls Hostel",       room:"D-118", year:"2023-27", semester:"Spring 2026", messFee:25000, amountPaid:25000, refundEarned:320,  status:"Active",   email:"sneha@nitm.ac.in",   phone:"9876543213" },
    { rollNo:"B21ME055", name:"Deepak Nath",      gender:"M", dept:"ME", hostel:"Boys Hostel (Single Seater)", room:"A-220", year:"2021-25", semester:"Spring 2026", messFee:25000, amountPaid:25000, refundEarned:0,    status:"Inactive", email:"deepak@nitm.ac.in",  phone:"9876543214" },
    { rollNo:"B22EE009", name:"Ananya Roy",       gender:"F", dept:"EE", hostel:"Girls Hostel", room:"E-102", year:"2022-26", semester:"Spring 2026", messFee:25000, amountPaid:25000, refundEarned:1560, status:"Active",   email:"ananya@nitm.ac.in",  phone:"9876543215" },
    { rollNo:"B23CS031", name:"Kiran Das",        gender:"M", dept:"CS", hostel:"Boys Hostel (Triple Seater)", room:"B-407", year:"2023-27", semester:"Spring 2026", messFee:25000, amountPaid:15000, refundEarned:910,  status:"On Leave", email:"kiran@nitm.ac.in",   phone:"9876543216" },
    { rollNo:"B24ME001", name:"Meghna Kalita",    gender:"F", dept:"ME", hostel:"Girls Hostel",      room:"F-201", year:"2024-28", semester:"Spring 2026", messFee:25000, amountPaid:25000, refundEarned:650,  status:"Active",   email:"meghna@nitm.ac.in",  phone:"9876543217" },
    { rollNo:"B22CS018", name:"Subham Gogoi",     gender:"M", dept:"CS", hostel:"Boys Hostel (Single Seater)", room:"G-305", year:"2022-26", semester:"Spring 2026", messFee:25000, amountPaid:25000, refundEarned:1170, status:"Active",   email:"subham@nitm.ac.in",  phone:"9876543218" },
    { rollNo:"B23EE044", name:"Pallavi Singh",    gender:"F", dept:"EE", hostel:"Girls Hostel", room:"H-109", year:"2023-27", semester:"Spring 2026", messFee:25000, amountPaid:25000, refundEarned:390,  status:"Active",   email:"pallavi@nitm.ac.in", phone:"9876543219" },
    { rollNo:"B21CS007", name:"Ajay Mishra",      gender:"M", dept:"CS", hostel:"Boys Hostel (Triple Seater)", room:"A-318", year:"2021-25", semester:"Spring 2026", messFee:25000, amountPaid:25000, refundEarned:2080, status:"Active",   email:"ajay@nitm.ac.in",    phone:"9876543220" },
    { rollNo:"B24CE012", name:"Ritika Hazarika",  gender:"F", dept:"CE", hostel:"Girls Hostel", room:"B-213", year:"2024-28", semester:"Spring 2026", messFee:25000, amountPaid:20000, refundEarned:520,  status:"Active",   email:"ritika@nitm.ac.in",  phone:"9876543221" },
    { rollNo:"B22EE003", name:"Bipul Saikia",     gender:"M", dept:"EE", hostel:"Boys Hostel (Single Seater)", room:"C-114", year:"2022-26", semester:"Spring 2026", messFee:25000, amountPaid:25000, refundEarned:860,  status:"Active",   email:"bipul@nitm.ac.in",   phone:"9876543222" },
    { rollNo:"B23EC019", name:"Lata Marak",       gender:"F", dept:"EC", hostel:"Girls Hostel",      room:"D-307", year:"2023-27", semester:"Spring 2026", messFee:25000, amountPaid:25000, refundEarned:1040, status:"Active",   email:"lata@nitm.ac.in",    phone:"9876543223" },
    { rollNo:"B24CS008", name:"Rajan Bordoloi",   gender:"M", dept:"CS", hostel:"Boys Hostel (Triple Seater)", room:"A-210", year:"2024-28", semester:"Spring 2026", messFee:25000, amountPaid:12500, refundEarned:0,    status:"On Leave", email:"rajan@nitm.ac.in",   phone:"9876543224" },
  ];

  for (const s of students) {
    await prisma.student.create({ data: s });
    // create student user account
    await prisma.user.create({
      data: {
        username: s.rollNo,
        password: studentDOBHash,
        role: 'student',
        studentId: s.rollNo
      }
    });
  }

  // seed leaves
  const leaves = [
    { rollNo:"B23EC015", studentName:"Rohit Thapa",    hostel:"Boys Hostel (Triple Seater)", leaveStart:"2026-05-10", leaveEnd:"2026-05-17", reason:"Family function",    breakfastMissed:7,  lunchMissed:7,  dinnerMissed:6,  refundAmount:1265, status:"Verified", semester:"Spring 2026" },
    { rollNo:"B22ME001", studentName:"Arjun Sharma",   hostel:"Boys Hostel (Single Seater)", leaveStart:"2026-04-20", leaveEnd:"2026-04-27", reason:"Medical emergency",  breakfastMissed:7,  lunchMissed:7,  dinnerMissed:7,  refundAmount:1120, status:"Verified", semester:"Spring 2026" },
    { rollNo:"B22EE009", studentName:"Ananya Roy",     hostel:"Girls Hostel", leaveStart:"2026-05-22", leaveEnd:"2026-05-28", reason:"Hometown visit",     breakfastMissed:6,  lunchMissed:6,  dinnerMissed:6,  refundAmount:960,  status:"Pending",  semester:"Spring 2026" },
    { rollNo:"B23CS031", studentName:"Kiran Das",      hostel:"Boys Hostel (Triple Seater)", leaveStart:"2026-06-01", leaveEnd:"2026-06-08", reason:"Sports tournament",  breakfastMissed:7,  lunchMissed:7,  dinnerMissed:7,  refundAmount:1120, status:"Pending",  semester:"Spring 2026" },
    { rollNo:"B22CS018", studentName:"Subham Gogoi",   hostel:"Boys Hostel (Single Seater)", leaveStart:"2026-04-12", leaveEnd:"2026-04-22", reason:"Internship travel",  breakfastMissed:10, lunchMissed:10, dinnerMissed:9,  refundAmount:1585, status:"Verified", semester:"Spring 2026" },
    { rollNo:"B22CS042", studentName:"Priya Devi",     hostel:"Girls Hostel", leaveStart:"2026-05-05", leaveEnd:"2026-05-09", reason:"Personal",           breakfastMissed:4,  lunchMissed:4,  dinnerMissed:4,  refundAmount:640,  status:"Rejected", semester:"Spring 2026" },
    { rollNo:"B24ME001", studentName:"Meghna Kalita",  hostel:"Girls Hostel",      leaveStart:"2026-06-10", leaveEnd:"2026-06-14", reason:"Conference",         breakfastMissed:4,  lunchMissed:5,  dinnerMissed:4,  refundAmount:770,  status:"Pending",  semester:"Spring 2026" },
    { rollNo:"B22EE003", studentName:"Bipul Saikia",   hostel:"Boys Hostel (Single Seater)", leaveStart:"2026-03-18", leaveEnd:"2026-03-25", reason:"Family emergency",   breakfastMissed:7,  lunchMissed:7,  dinnerMissed:7,  refundAmount:1120, status:"Verified", semester:"Spring 2026" },
    { rollNo:"B24CS008", studentName:"Rajan Bordoloi", hostel:"Boys Hostel (Triple Seater)", leaveStart:"2026-06-15", leaveEnd:"2026-06-30", reason:"Research internship",breakfastMissed:15, lunchMissed:15, dinnerMissed:15, refundAmount:2400, status:"Pending",  semester:"Spring 2026" },
  ];

  for (const l of leaves) {
    await prisma.leaveRecord.create({ data: l });
  }

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
