import { PrismaClient, CourtType, SurfaceType, CustomerSegment, Language, BookingType, BookingStatus, EventType, AdminRole, Channel, ConversationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with Jordanian data...');

  // 1. Seed Admin User
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@bookingcourts.jo' },
    update: {},
    create: {
      email: 'admin@bookingcourts.jo',
      name: 'Hussein Al-Ammani',
      passwordHash: 'hashed_password_placeholder', // In real app, use bcrypt
      role: AdminRole.owner,
      isActive: true,
    },
  });

  // 2. Seed Courts (Authentic Jordanian Locations)
  const courtsData = [
    {
      name: 'Abdoun Arena',
      nameAr: 'أرينا عبدون',
      type: CourtType.V5,
      surface: SurfaceType.artificial_grass,
      capacity: 10,
      hourlyRate: 25.0,
      peakRate: 35.0,
      mapsLink: 'https://maps.google.com/?q=Abdoun+Amman',
      locationLat: 31.9482,
      locationLng: 35.8891,
    },
    {
      name: '7th Circle Stadium',
      nameAr: 'ملعب الدوار السابع',
      type: CourtType.V7,
      surface: SurfaceType.artificial_grass,
      capacity: 14,
      hourlyRate: 40.0,
      peakRate: 55.0,
      mapsLink: 'https://maps.google.com/?q=7th+Circle+Amman',
      locationLat: 31.9333,
      locationLng: 35.8667,
    },
    {
      name: 'Zarqa Sport City',
      nameAr: 'مدينة الزرقاء الرياضية',
      type: CourtType.V11,
      surface: SurfaceType.natural_grass,
      capacity: 22,
      hourlyRate: 60.0,
      peakRate: 80.0,
      mapsLink: 'https://maps.google.com/?q=Zarqa+Sport+City',
      locationLat: 32.0667,
      locationLng: 36.1000,
    },
    {
      name: 'Khalda Football Court',
      nameAr: 'ملعب خلدا لكرة القدم',
      type: CourtType.V5,
      surface: SurfaceType.artificial_grass,
      capacity: 10,
      hourlyRate: 20.0,
      peakRate: 30.0,
      mapsLink: 'https://maps.google.com/?q=Khalda+Amman',
      locationLat: 31.9772,
      locationLng: 35.8422,
    },
  ];

  const createdCourts = [];
  for (const c of courtsData) {
    const court = await prisma.court.create({ data: c });
    createdCourts.push(court);
  }

  // 3. Seed Event Packages
  const packagesData = [
    {
      name: 'Birthday Extravaganza',
      nameAr: 'حفلة ميلاد مميزة',
      type: EventType.birthday,
      description: 'Full court booking with decorations and cake area.',
      descriptionAr: 'حجز كامل للملعب مع الزينة ومنطقة خاصة للكيك.',
      basePrice: 150.0,
      maxGuests: 30,
      includesDecorations: true,
      includesCatering: false,
      durationMins: 180,
    },
    {
      name: 'Corporate Tournament',
      nameAr: 'بطولة شركات',
      type: EventType.corporate,
      description: 'Professional tournament setup with referees and catering.',
      descriptionAr: 'تنظيم بطولة احترافية مع حكام وضيافة.',
      basePrice: 500.0,
      maxGuests: 100,
      includesDecorations: true,
      includesCatering: true,
      durationMins: 360,
    },
  ];

  for (const p of packagesData) {
    await prisma.eventPackage.create({ data: p });
  }

  // 4. Seed sample Customers (Jordanian numbers)
  const customersData = [
    {
      phone: '+962791111111',
      name: 'Ahmad Mansour',
      email: 'ahmad@example.jo',
      segment: CustomerSegment.regular,
      preferredLang: Language.ar,
      totalBookings: 5,
      totalSpent: 125.0,
    },
    {
      phone: '+962782222222',
      name: 'Zaid Fawzi',
      segment: CustomerSegment.vip,
      preferredLang: Language.en,
      totalBookings: 12,
      totalSpent: 480.0,
    },
  ];

  for (const cust of customersData) {
    await prisma.customer.create({ data: cust });
  }

  // 5. Seed Pricing Rules (Peak hours 6 PM - 12 AM)
  for (const court of createdCourts) {
    await prisma.pricingRule.create({
      data: {
        courtId: court.id,
        startHour: 18,
        endHour: 24,
        price: court.peakRate,
        isPeak: true,
      },
    });
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
