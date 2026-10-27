import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { Leave } from '../models/Leave.js';
import { Payroll } from '../models/Payroll.js';
import { JobOpening } from '../models/JobOpening.js';
import { Candidate } from '../models/Candidate.js';
import { Announcement } from '../models/Announcement.js';
import { AuditLog } from '../models/AuditLog.js';

dotenv.config();

const indianEmployees = [
  {
    employeeCode: 'EMP-1001',
    firstName: 'Rajesh',
    lastName: 'Sharma',
    email: 'admin@staffsync.com',
    phone: '+91 98201 45678',
    department: 'Human Resources',
    designation: 'VP of People & Culture',
    role: 'admin',
    workLocation: 'Bengaluru HQ (Bellandur)',
    workMode: 'Hybrid',
    panNumber: 'ABCPS1234F',
    uanNumber: '101488992341',
    bankDetails: { bankName: 'HDFC Bank', accountNo: '50100456123490', ifscCode: 'HDFC0000240' },
    dob: new Date('1987-10-14'),
    joiningDate: new Date('2021-03-15'),
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    salary: { basic: 95000, hra: 47500, allowances: 22000, conveyance: 3500, pf: 11400, professionalTax: 200, deductions: 6000, netPay: 150400 },
  },
  {
    employeeCode: 'EMP-1002',
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'manager@staffsync.com',
    phone: '+91 98450 12345',
    department: 'Engineering',
    designation: 'Director of Engineering',
    role: 'manager',
    workLocation: 'Bengaluru HQ (Whitefield)',
    workMode: 'Office',
    panNumber: 'BKLPP9876K',
    uanNumber: '101299887766',
    bankDetails: { bankName: 'ICICI Bank', accountNo: '001205009876', ifscCode: 'ICIC0000012' },
    dob: new Date('1989-10-28'),
    joiningDate: new Date('2022-01-10'),
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    salary: { basic: 110000, hra: 55000, allowances: 25000, conveyance: 3500, pf: 13200, professionalTax: 200, deductions: 8000, netPay: 172100 },
  },
  {
    employeeCode: 'EMP-1003',
    firstName: 'Amit',
    lastName: 'Verma',
    email: 'employee@staffsync.com',
    phone: '+91 97112 34567',
    department: 'Engineering',
    designation: 'Senior Full Stack Engineer',
    role: 'employee',
    workLocation: 'Pune (Hinjawadi Phase 1)',
    workMode: 'Hybrid',
    panNumber: 'CYZPV5678M',
    uanNumber: '101344556677',
    bankDetails: { bankName: 'State Bank of India', accountNo: '309876543210', ifscCode: 'SBIN0001234' },
    dob: new Date('1994-06-18'),
    joiningDate: new Date('2022-10-01'),
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    salary: { basic: 75000, hra: 37500, allowances: 16000, conveyance: 3500, pf: 9000, professionalTax: 200, deductions: 4500, netPay: 118300 },
  },
  {
    employeeCode: 'EMP-1004',
    firstName: 'Neha',
    lastName: 'Kulkarni',
    email: 'neha.kulkarni@staffsync.com',
    phone: '+91 98220 98765',
    department: 'Design',
    designation: 'Lead Product Designer',
    role: 'employee',
    workLocation: 'Mumbai (BKC Cybercity)',
    workMode: 'Hybrid',
    panNumber: 'DFGNK4321P',
    uanNumber: '101566778899',
    bankDetails: { bankName: 'Axis Bank', accountNo: '91201004567890', ifscCode: 'UTIB0000123' },
    dob: new Date('1992-04-12'),
    joiningDate: new Date('2023-02-14'),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    salary: { basic: 70000, hra: 35000, allowances: 14000, conveyance: 3500, pf: 8400, professionalTax: 200, deductions: 4200, netPay: 109700 },
  },
  {
    employeeCode: 'EMP-1005',
    firstName: 'Vikram',
    lastName: 'Malhotra',
    email: 'vikram.malhotra@staffsync.com',
    phone: '+91 99001 23456',
    department: 'Engineering',
    designation: 'Principal Cloud Architect',
    role: 'manager',
    workLocation: 'Hyderabad (HITEC City)',
    workMode: 'Office',
    panNumber: 'GHJVM8765Q',
    uanNumber: '101788990011',
    bankDetails: { bankName: 'HDFC Bank', accountNo: '50100678901234', ifscCode: 'HDFC0000456' },
    dob: new Date('1988-10-20'),
    joiningDate: new Date('2022-04-01'),
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    salary: { basic: 105000, hra: 52500, allowances: 24000, conveyance: 3500, pf: 12600, professionalTax: 200, deductions: 7500, netPay: 164700 },
  },
  {
    employeeCode: 'EMP-1006',
    firstName: 'Ananya',
    lastName: 'Iyer',
    email: 'ananya.iyer@staffsync.com',
    phone: '+91 94440 87654',
    department: 'Human Resources',
    designation: 'Senior Talent Acquisition Partner',
    role: 'employee',
    workLocation: 'Bengaluru HQ (Bellandur)',
    workMode: 'Hybrid',
    panNumber: 'JKLNA3214T',
    uanNumber: '101899001122',
    bankDetails: { bankName: 'Kotak Mahindra Bank', accountNo: '2012456789', ifscCode: 'KKBK0000123' },
    dob: new Date('1993-08-05'),
    joiningDate: new Date('2023-09-15'),
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    salary: { basic: 62000, hra: 31000, allowances: 12000, conveyance: 3500, pf: 7440, professionalTax: 200, deductions: 3500, netPay: 97360 },
  },
  {
    employeeCode: 'EMP-1007',
    firstName: 'Rohan',
    lastName: 'Deshmukh',
    email: 'rohan.deshmukh@staffsync.com',
    phone: '+91 98190 65432',
    department: 'Finance',
    designation: 'Finance Controller & Payroll Lead',
    role: 'employee',
    workLocation: 'Mumbai (BKC Cybercity)',
    workMode: 'Office',
    panNumber: 'MNOPR7654Z',
    uanNumber: '101900112233',
    bankDetails: { bankName: 'ICICI Bank', accountNo: '001205004567', ifscCode: 'ICIC0000045' },
    dob: new Date('1991-12-09'),
    joiningDate: new Date('2022-05-18'),
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    salary: { basic: 78000, hra: 39000, allowances: 17000, conveyance: 3500, pf: 9360, professionalTax: 200, deductions: 5000, netPay: 122940 },
  },
  {
    employeeCode: 'EMP-1008',
    firstName: 'Divya',
    lastName: 'Nair',
    email: 'divya.nair@staffsync.com',
    phone: '+91 98470 54321',
    department: 'Engineering',
    designation: 'Site Reliability & DevOps Engineer',
    role: 'employee',
    workLocation: 'Bengaluru HQ (Whitefield)',
    workMode: 'WFH',
    panNumber: 'QWERN9812L',
    uanNumber: '101911223344',
    bankDetails: { bankName: 'HDFC Bank', accountNo: '50100789012345', ifscCode: 'HDFC0000123' },
    dob: new Date('1995-10-18'),
    joiningDate: new Date('2023-11-01'),
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    salary: { basic: 68000, hra: 34000, allowances: 15000, conveyance: 3500, pf: 8160, professionalTax: 200, deductions: 4000, netPay: 108140 },
  },
];

export const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/staffsync';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    console.log('\x1b[34m%s\x1b[0m', '🇮🇳 Seeding StaffSync with Authentic Indian Corporate HRMS Data...');

    // Clear existing collections
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await Payroll.deleteMany({});
    await JobOpening.deleteMany({});
    await Candidate.deleteMany({});
    await Announcement.deleteMany({});
    await AuditLog.deleteMany({});

    // 1. Create Indian Employees & Users
    const createdEmployees = [];
    for (const empData of indianEmployees) {
      const employee = await Employee.create({
        ...empData,
        leaveBalances: { casual: 10, sick: 9, paid: 15, restricted: 2 },
        documents: [
          {
            title: 'Offer of Employment & Appointment Letter',
            fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            uploadedAt: empData.joiningDate,
          },
          {
            title: 'PAN & Aadhaar Identity Verification Record',
            fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            uploadedAt: empData.joiningDate,
          },
        ],
      });

      const user = await User.create({
        email: empData.email,
        password: 'Password123!',
        role: empData.role,
        employeeId: employee._id,
      });

      employee.userId = user._id;
      await employee.save();
      createdEmployees.push(employee);
    }

    // Set Manager mapping: Priya Patel manages Amit & Divya, Vikram manages Hyderabad team
    const priya = createdEmployees.find((e) => e.email === 'manager@staffsync.com');
    const rajesh = createdEmployees.find((e) => e.email === 'admin@staffsync.com');
    const vikram = createdEmployees.find((e) => e.email === 'vikram.malhotra@staffsync.com');

    for (const emp of createdEmployees) {
      if (emp.department === 'Engineering' && emp.email !== 'manager@staffsync.com') {
        emp.manager = priya._id;
        await emp.save();
      } else if (emp.email !== 'admin@staffsync.com') {
        emp.manager = rajesh._id;
        await emp.save();
      }
    }

    // 2. Attendance records for past 7 days across Indian Tech Centers
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      for (const emp of createdEmployees) {
        const isToday = dateStr === todayStr;
        const checkInHour = 8 + Math.floor(Math.random() * 2);
        const checkInMinute = Math.floor(Math.random() * 50);
        const checkIn = new Date(d);
        checkIn.setHours(checkInHour, checkInMinute, 0);

        const checkOut = new Date(d);
        checkOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 45), 0);

        const workHours = isToday ? 4.5 : Math.round(((checkOut - checkIn) / 3600000) * 10) / 10;
        const status = checkInHour >= 9 && checkInMinute > 30 ? 'late' : 'present';

        await Attendance.create({
          employee: emp._id,
          date: dateStr,
          checkIn,
          checkOut: isToday ? null : checkOut,
          workHours: isToday ? 0 : workHours,
          status,
          notes: status === 'late' ? 'Traffic bottleneck at Silk Board / Marathahalli' : 'Standard biometric check-in',
          location: emp.workLocation.includes('WFH') ? 'Work From Home (WFH)' : emp.workLocation,
        });
      }
    }

    // 3. Indian Leave Requests (CL, SL, EL, RH)
    await Leave.create([
      {
        employee: createdEmployees[2]._id, // Amit Verma
        leaveType: 'casual',
        startDate: new Date(Date.now() + 86400000 * 3),
        endDate: new Date(Date.now() + 86400000 * 5),
        daysCount: 3,
        reason: 'Attending cousin wedding in Jaipur, Rajasthan',
        status: 'pending',
      },
      {
        employee: createdEmployees[3]._id, // Neha Kulkarni
        leaveType: 'paid',
        startDate: new Date(Date.now() + 86400000 * 8),
        endDate: new Date(Date.now() + 86400000 * 12),
        daysCount: 5,
        reason: 'Diwali family vacation to hometown Pune',
        status: 'approved',
        reviewedBy: rajesh._id,
        reviewerName: 'Rajesh Sharma',
        reviewNote: 'Approved. Advance Happy Diwali to your family!',
        reviewedAt: new Date(),
      },
      {
        employee: createdEmployees[7]._id, // Divya Nair
        leaveType: 'sick',
        startDate: new Date(Date.now() - 86400000 * 3),
        endDate: new Date(Date.now() - 86400000 * 2),
        daysCount: 2,
        reason: 'High fever and viral flu',
        status: 'approved',
        reviewedBy: priya._id,
        reviewerName: 'Priya Patel',
        reviewNote: 'Get well soon, please take complete rest.',
        reviewedAt: new Date(Date.now() - 86400000 * 3),
      },
    ]);

    // 4. Monthly Indian Payroll Records (INR ₹)
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    for (const emp of createdEmployees) {
      const basic = emp.salary.basic;
      const hra = emp.salary.hra;
      const allowances = emp.salary.allowances;
      const conveyance = emp.salary.conveyance || 3500;
      const pf = emp.salary.pf;
      const pt = emp.salary.professionalTax || 200;
      const tax = Math.round(basic * 0.08); // 8% TDS estimate under new regime
      const bonus = 5000; // Festive Diwali advance bonus
      const totalEarnings = basic + hra + allowances + conveyance + bonus;
      const totalDeductions = pf + pt + tax;
      const netPay = totalEarnings - totalDeductions;

      await Payroll.create({
        employee: emp._id,
        month: currentMonth,
        year: currentYear,
        monthName: monthNames[currentMonth - 1],
        basic,
        hra,
        allowances,
        conveyance,
        bonus,
        pf,
        professionalTax: pt,
        tax,
        deductions: 0,
        totalEarnings,
        totalDeductions,
        netPay,
        paymentStatus: 'paid',
        paymentDate: new Date(),
      });
    }

    // 5. Indian Tech Job Openings & Kanban Candidate Pipeline
    const job1 = await JobOpening.create({
      title: 'Senior MERN / Full Stack Developer',
      department: 'Engineering',
      location: 'Bengaluru (Bellandur / Hybrid)',
      jobType: 'Full-time',
      vacancies: 3,
      experience: '4-7 years',
      salaryRange: '₹18,00,000 - ₹26,00,000 LPA',
      description: 'Hands-on React 19, Node.js, distributed microservices, MongoDB and Redis caching.',
      status: 'open',
    });

    const job2 = await JobOpening.create({
      title: 'DevOps & Kubernetes Specialist',
      department: 'Engineering',
      location: 'Hyderabad / Pune',
      jobType: 'Full-time',
      vacancies: 2,
      experience: '3-6 years',
      salaryRange: '₹16,00,000 - ₹24,00,000 LPA',
      description: 'Manage production AWS EKS clusters, Terraform, CI/CD pipelines and Helm deployments.',
      status: 'open',
    });

    await Candidate.create([
      {
        name: 'Aditya Swaminathan',
        email: 'aditya.swami@gmail.com',
        phone: '+91 98840 12345',
        jobOpening: job1._id,
        jobTitle: job1.title,
        stage: 'interview',
        rating: 5,
        experienceYears: 5,
        currentCtc: '15.5 LPA',
        expectedCtc: '22 LPA',
        noticePeriod: '30 Days',
        location: 'Bengaluru (IIT Madras alum)',
        notes: 'Cleared System Design round with flying colors. Strong knowledge of Kafka & MongoDB sharding.',
      },
      {
        name: 'Sneha Chawla',
        email: 'sneha.chawla@outlook.com',
        phone: '+91 99100 87654',
        jobOpening: job1._id,
        jobTitle: job1.title,
        stage: 'screening',
        rating: 4,
        experienceYears: 4,
        currentCtc: '12 LPA',
        expectedCtc: '18 LPA',
        noticePeriod: 'Immediate / Buyout',
        location: 'Gurugram (BITS Pilani)',
        notes: 'Strong JavaScript fundamentals. Good problem solving on LeetCode. Scheduled for tech screen.',
      },
      {
        name: 'Karthik Ramanathan',
        email: 'karthik.r@yahoo.co.in',
        phone: '+91 98401 98765',
        jobOpening: job2._id,
        jobTitle: job2.title,
        stage: 'offer',
        rating: 5,
        experienceYears: 6,
        currentCtc: '18 LPA',
        expectedCtc: '25 LPA',
        noticePeriod: '60 Days',
        location: 'Hyderabad (NIT Warangal)',
        notes: 'Official offer roll-out approved by VP HR Rajesh Sharma.',
      },
      {
        name: 'Pooja Bhattacharya',
        email: 'pooja.bhatt@gmail.com',
        phone: '+91 98300 23456',
        jobOpening: job2._id,
        jobTitle: job2.title,
        stage: 'applied',
        rating: 4,
        experienceYears: 3,
        currentCtc: '10 LPA',
        expectedCtc: '15 LPA',
        noticePeriod: '30 Days',
        location: 'Pune',
        notes: 'Received resume via employee referral from Amit Verma.',
      },
    ]);

    // 6. Indian Corporate Announcements
    await Announcement.create([
      {
        title: '🪔 Diwali Festival Holidays & Annual Bonus Dispatch',
        content:
          'StaffSync family wishes everyone a very Happy Diwali! Our offices in Bengaluru, Mumbai, Pune, Hyderabad, and Gurugram will observe holidays on Oct 31st and Nov 1st. Diwali festive advance bonus has been credited along with this month payslip.',
        priority: 'urgent',
        targetDepartment: 'All',
        authorName: 'Rajesh Sharma (VP HR)',
        isPinned: true,
      },
      {
        title: '📋 FY2026-27 IT Declaration & Form 16 Window Open',
        content:
          'The finance team has opened the annual tax investment proof submission window on the portal. Please submit Section 80C, 80D, and HRA rent receipts or opt for the New Tax Regime before Nov 20th.',
        priority: 'high',
        targetDepartment: 'All',
        authorName: 'Rohan Deshmukh (Finance Controller)',
        isPinned: true,
      },
      {
        title: '🚀 StaffSync All-India Hackathon: Generative AI in HRMS',
        content:
          'Join us this Friday for the 36-hour internal hackathon across our Bengaluru, Pune, and Hyderabad engineering hubs. Exciting cash rewards and spot bonuses for top 3 teams!',
        priority: 'medium',
        targetDepartment: 'Engineering',
        authorName: 'Priya Patel (Director of Engineering)',
        isPinned: false,
      },
    ]);

    // 7. Initial Indian Audit Trail
    await AuditLog.create([
      {
        actorName: 'Rajesh Sharma',
        actorEmail: 'admin@staffsync.com',
        actorRole: 'admin',
        action: 'SYSTEM_PROVISIONED',
        entityType: 'System',
        details: 'StaffSync India Technologies HRMS Suite successfully provisioned with Bengaluru, Mumbai & Pune tech rosters.',
      },
      {
        actorName: 'Priya Patel',
        actorEmail: 'manager@staffsync.com',
        actorRole: 'manager',
        action: 'PAYROLL_PROCESSED',
        entityType: 'Payroll',
        details: `Dispatched October salary slips in INR for ${createdEmployees.length} Indian tech team members.`,
      },
    ]);

    console.log('\x1b[32m%s\x1b[0m', '✔ StaffSync Database Seeded Successfully with Indian Corporate Roster!');
    console.log('\x1b[36m%s\x1b[0m', '----------------------------------------------------------------------');
    console.log('🇮🇳 Demo Credentials (Password for all: Password123!)');
    console.log('1. Admin/HR:  admin@staffsync.com    (Rajesh Sharma - VP HR)');
    console.log('2. Manager:   manager@staffsync.com  (Priya Patel - Director of Engineering)');
    console.log('3. Employee:  employee@staffsync.com (Amit Verma - Senior Full Stack Engineer)');
    console.log('\x1b[36m%s\x1b[0m', '----------------------------------------------------------------------');
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

if (process.argv[1]?.includes('seeder.js')) {
  seedDatabase().then(() => {
    mongoose.connection.close();
    process.exit(0);
  });
}
