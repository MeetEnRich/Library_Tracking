const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Clean existing data
  console.log('Cleaning existing data...');
  await prisma.occupancySnapshot.deleteMany({});
  await prisma.log.deleteMany({});
  await prisma.zone.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.admin.deleteMany({});

  // 2. Create Admin
  console.log('Creating admin...');
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.create({
    data: {
      username: 'admin',
      passwordHash: adminPasswordHash,
    },
  });
  console.log(`Admin created: ${admin.username}`);

  // 3. Create Zones
  console.log('Creating zones...');
  const zonesData = [
    { name: 'Circulation Unit', qrToken: 'ZONE_CIRCULATION_FULAFIA', totalSeats: 50 },
    { name: 'Reference Section', qrToken: 'ZONE_REFERENCE_FULAFIA', totalSeats: 80 },
    { name: 'e-Library Section', qrToken: 'ZONE_ELIBRARY_FULAFIA', totalSeats: 60 }
  ];

  const zones = [];
  for (const z of zonesData) {
    const zone = await prisma.zone.create({
      data: z
    });
    zones.push(zone);
    console.log(`Zone created: ${zone.name} (${zone.totalSeats} seats)`);
  }

  // 4. Create Students
  console.log('Creating students...');
  const studentsData = [
    { matricNo: '2021/CP/CSC/0054', name: 'Audu Patrick', department: 'Computer Science' },
    { matricNo: '2021/CP/CSC/0001', name: 'Abubakar Ibrahim', department: 'Computer Science' },
    { matricNo: '2021/CP/CSC/0005', name: 'Chioma Nwachukwu', department: 'Computer Science' },
    { matricNo: '2021/CP/CSC/0012', name: 'Olumide Akinyemi', department: 'Computer Science' },
    { matricNo: '2021/CP/CSC/0018', name: 'Fatima Bello', department: 'Computer Science' },
    { matricNo: '2021/CP/CSC/0023', name: 'Musa Yakubu', department: 'Computer Science' },
    { matricNo: '2021/CP/CSC/0031', name: 'Emeka Okafor', department: 'Computer Science' },
    { matricNo: '2021/CP/CSC/0039', name: 'Aisha Mohammed', department: 'Computer Science' },
    { matricNo: '2021/CP/CSC/0042', name: 'Blessing Ekong', department: 'Computer Science' },
    { matricNo: '2021/CP/CSC/0048', name: 'Tunde Balogun', department: 'Computer Science' },
    { matricNo: '2021/CP/CSC/0050', name: 'Hadiza Dahiru', department: 'Computer Science' },
    { matricNo: '2021/CP/CSC/0061', name: 'Ngozi Eze', department: 'Computer Science' }
  ];

  const studentPasswordHash = await bcrypt.hash('student123', 10);
  const students = [];
  for (const s of studentsData) {
    const student = await prisma.student.create({
      data: {
        ...s,
        passwordHash: studentPasswordHash
      }
    });
    students.push(student);
  }
  console.log(`${students.length} students created.`);

  // 5. Create Historical Logs and Snapshots (spread across past 7 days)
  console.log('Generating rich historical logs & snapshots...');
  const now = new Date();
  
  // Helper to generate a random number of minutes
  const randRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Define peak periods of checking in:
  // Usually busy between 9:00 AM and 5:00 PM (9h to 17h)
  for (let dayOffset = 7; dayOffset >= 0; dayOffset--) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() - dayOffset);
    
    // We generate multiple check-ins per day
    for (const zone of zones) {
      // Determine daily visitor count (weekend is less busy)
      const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
      const numVisitors = isWeekend ? randRange(2, 5) : randRange(8, 15);
      
      let concurrentActive = 0;
      
      for (let i = 0; i < numVisitors; i++) {
        // Random check-in hour between 8:00 AM and 5:00 PM
        const entryHour = randRange(8, 16);
        const entryMinute = randRange(0, 59);
        
        const entryTime = new Date(targetDate);
        entryTime.setHours(entryHour, entryMinute, 0, 0);
        
        // Random study duration (between 45 minutes and 4 hours)
        const durationMin = randRange(45, 240);
        const exitTime = new Date(entryTime.getTime() + durationMin * 60 * 1000);
        
        // Pick a random student
        const student = students[randRange(0, students.length - 1)];
        
        // Only insert if entryTime is in the past
        if (entryTime.getTime() < now.getTime()) {
          // Create Log
          await prisma.log.create({
            data: {
              matricNo: student.matricNo,
              zoneId: zone.id,
              entryTime: entryTime,
              // If it's today and exit time is in the future, keep it active (null exitTime)
              exitTime: exitTime.getTime() < now.getTime() ? exitTime : null
            }
          });
          
          if (exitTime.getTime() > now.getTime()) {
            concurrentActive++;
          }
        }
      }
      
      // Seed Occupancy Snapshots for this day (at distinct intervals e.g. every 2 hours)
      // This creates data for comparison charts (YOLO vs QR)
      const snapshotHours = [8, 10, 12, 14, 16, 18];
      for (const hr of snapshotHours) {
        const snapshotTime = new Date(targetDate);
        snapshotTime.setHours(hr, 0, 0, 0);
        
        if (snapshotTime.getTime() < now.getTime()) {
          // Simulate some occupancy level at this hour
          // Reference section is busiest, e-Library is moderate, Circulation is low-medium
          let baseCount = 0;
          if (hr >= 10 && hr <= 15) {
            baseCount = zone.name.includes('Reference') ? randRange(35, 60) :
                        zone.name.includes('e-Library') ? randRange(25, 45) : randRange(15, 30);
          } else {
            baseCount = zone.name.includes('Reference') ? randRange(10, 25) :
                        zone.name.includes('e-Library') ? randRange(5, 15) : randRange(2, 10);
          }
          
          // Weekend adjustment
          if (isWeekend) {
            baseCount = Math.floor(baseCount * 0.2);
          }

          // Create QR Snapshot
          await prisma.occupancySnapshot.create({
            data: {
              zoneId: zone.id,
              source: 'qr',
              count: baseCount,
              timestamp: snapshotTime
            }
          });

          // Create CV Snapshot (YOLO detection)
          // CV detection might vary slightly from QR (due to non-scans, occlusion, etc.)
          // Let's make it slightly different (e.g. +/- 5%)
          const cvVariation = randRange(-3, 3);
          const cvCount = Math.max(0, baseCount + cvVariation);

          await prisma.occupancySnapshot.create({
            data: {
              zoneId: zone.id,
              source: 'cv',
              count: cvCount,
              timestamp: snapshotTime
            }
          });
        }
      }
    }
  }

  // 6. Seed some current active users (logs with null exitTime) for today
  console.log('Seeding currently active check-ins...');
  // Let's check in 3 students right now
  const activeStudents = [students[0], students[2], students[4]];
  const activeZones = [zones[2], zones[1], zones[2]]; // e-Library and Reference
  
  for (let idx = 0; idx < activeStudents.length; idx++) {
    const student = activeStudents[idx];
    const zone = activeZones[idx];
    const checkinTime = new Date(now.getTime() - randRange(15, 90) * 60 * 1000); // checked in 15-90 min ago

    await prisma.log.create({
      data: {
        matricNo: student.matricNo,
        zoneId: zone.id,
        entryTime: checkinTime,
        exitTime: null
      }
    });

    console.log(`Active check-in seeded: ${student.name} at ${zone.name}`);
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
