import * as crypto from 'crypto';
import {
  PrismaClient,
  Prisma,
  UserRole,
  UserStatus,
  MeetingType,
  MeetingStatus,
  AttendeeRole,
  RsvpStatus,
  DsarRequestType,
  DsarStatus,
  ConsentPurpose,
  ConsentStatus,
  PaymentStatus,
  PaymentGateway,
  PaymentMethod,
  ContributionStatus,
  AnnouncementStatus,
  AnnouncementPriority,
  NotificationType,
  ComplaintCategory,
  ComplaintStatus,
  ComplianceCheckStatus,
  TrainingAssignmentStatus,
  ApplicationStatus,
  AuditAction,
} from '@prisma/client';

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// -----------------------------------------------------------------------------
// PRISMA INITS
// -----------------------------------------------------------------------------
const createPrisma = () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

const prisma = createPrisma();

// -----------------------------------------------------------------------------
// CONFIGS & HELPERS
// -----------------------------------------------------------------------------
const ASSOCIATIONS = [
  {
    slug: 'mfsa',
    short: 'mfsa',
    name: 'Meghalaya Finance Service Association',
    primaryColor: '#1e3a8a',
    secondaryColor: '#3b82f6',
  },
  {
    slug: 'mpsa',
    short: 'mpsa',
    name: 'Meghalaya Planning Service Association',
    primaryColor: '#065f46',
    secondaryColor: '#10b981',
  },
];

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

function buildUserEmail(role: UserRole, association: string) {
  return `${role.toLowerCase()}@${association}.org`;
}

function buildUserName(role: UserRole, association: string) {
  return `${association.toUpperCase()} ${role.replaceAll('_', ' ')}`;
}

export const encrypt = (plain: string): string => {
  const iv = crypto.randomBytes(16);
  const KEY = Buffer.from(
    process.env.FIELD_ENCRYPTION_KEY ||
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    'hex',
  );
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
};

// Helper to reliably sample random records from arrays
const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// -----------------------------------------------------------------------------
// SCALE SEEDING FUNCTION
// -----------------------------------------------------------------------------
async function seedAssociation(data: (typeof ASSOCIATIONS)[number]) {
  console.log(`\n--- Seeding ${data.name} ---`);

  const basePassword = await hashPassword(process.env.PASSWORD || 'securepassword123');
  const encKeyId = encrypt(process.env.RAZORPAY_KEY_ID || 'rzp_test_12345');
  const encSecret = encrypt(process.env.RAZORPAY_KEY_SECRET || 'secret_12345');
  const encWebhook = encrypt(process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_12345');

  // 1. Association
  const association = await prisma.association.create({
    data: {
      slug: data.slug,
      name: data.name,
      description: `${data.name} official association portal`,
      state: 'Meghalaya',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      currencyCode: 'INR',
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      contactEmail: `contact@${data.short}.org`,
      contactPhone: '9876543210',
    },
  });

  // 2. Member Types
  const mTypesConfig = [
    'Regular Member',
    'Executive Member',
    'Honorary Member',
    'Associate Member',
  ];
  const createdMemberTypes = [];
  for (let i = 0; i < mTypesConfig.length; i++) {
    const mt = await prisma.memberType.create({
      data: {
        associationId: association.id,
        description: mTypesConfig[i],
        level: i + 1,
      },
    });
    createdMemberTypes.push(mt);
  }

  // 3. Subscription Plans
  const subscriptionPlans = [];
  for (let i = 1; i <= 5; i++) {
    const sp = await prisma.subscriptionPlan.create({
      data: {
        associationId: association.id,
        name: `Tier ${i} Membership`,
        description: `Plan Tier Option Level ${i}`,
        versions: {
          create: {
            amount: new Prisma.Decimal(500 * i),
            currency: 'INR',
            billingCycle: i % 2 === 0 ? 'YEARLY' : 'MONTHLY',
            features: { voting: i > 1, newsletter: true, premiumEvents: i > 3 },
            description: `Plan Tier Option Level ${i}`,
          },
        },
      },
      include: {
        versions: {
          take: 1,
        },
      },
    });
    subscriptionPlans.push(sp);
  }

  // 4. ROLE-BASED USERS (for easy login testing)
  console.log('-> Creating role-based users for login testing...');
  const roles = [
    UserRole.SUPER_ADMIN,
    UserRole.PRESIDENT,
    UserRole.SECRETARY,
    UserRole.FINANCE,
    UserRole.DPO,
    UserRole.MEMBER,
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleUsers: Record<UserRole, any> = {} as any;

  for (const role of roles) {
    const user = await prisma.user.create({
      data: {
        associationId: association.id,
        email: buildUserEmail(role, data.short),
        name: buildUserName(role, data.short),
        mobile: '9999999999',
        designation: `${role} Designation`,
        role: [role],
        password: basePassword,
        status: UserStatus.ACTIVE,
        membershipNumber: `${data.short.toUpperCase()}-${role}`,
        imageUrl: 'https://placehold.co/300x300',
        mfaEnabled: false,
        memberTypeId: createdMemberTypes[0]?.id,
        subscription:
          role === UserRole.MEMBER
            ? {
                create: {
                  planId: subscriptionPlans[0].id,
                  planVersionId: subscriptionPlans[0].versions[0].id,
                  status: 'ACTIVE',
                  endDate: new Date('2027-01-01'),
                },
              }
            : undefined,
      },
    });
    roleUsers[role] = user;
    console.log(`   ✓ ${role}: ${user.email}`);
  }

  // 5. BULK USERS (1,000 records for load testing)
  console.log('-> Generating 1,000 bulk user accounts...');
  const usersToInsert: Prisma.UserCreateManyInput[] = [];
  for (let i = 1; i <= 1000; i++) {
    usersToInsert.push({
      associationId: association.id,
      email: `member.${i}@${data.short}portal.org`,
      name: `${data.short.toUpperCase()} Member ${i}`,
      mobile: `9${String(i).padStart(9, '0')}`,
      designation: 'Member Designation',
      role: [UserRole.MEMBER],
      password: basePassword,
      status: UserStatus.ACTIVE,
      membershipNumber: `${data.short.toUpperCase()}-BULK-${String(i).padStart(5, '0')}`,
      imageUrl: 'https://placehold.co/300x300',
      mfaEnabled: false,
      memberTypeId: createdMemberTypes[0]?.id,
    });
  }
  await prisma.user.createMany({ data: usersToInsert });

  const allUsers = await prisma.user.findMany({
    where: { associationId: association.id },
    select: { id: true, role: true, name: true },
  });

  // Role user references for bulk seeding
  const superAdminUser = roleUsers[UserRole.SUPER_ADMIN];
  const financeUser = roleUsers[UserRole.FINANCE];
  const secretaryUser = roleUsers[UserRole.SECRETARY];
  const dpoUser = roleUsers[UserRole.DPO];
  const memberUser = roleUsers[UserRole.MEMBER];

  // 6. Push Tokens (for role users)
  for (const role of roles) {
    await prisma.pushToken.create({
      data: {
        userId: roleUsers[role].id,
        token: `${data.short}-${role.toLowerCase()}-push-token`,
      },
    });
  }

  // 7. Bulk Push Tokens
  console.log('-> Generating bulk push tokens...');
  await prisma.pushToken.createMany({
    data: allUsers.map((u, i) => ({
      userId: u.id,
      token: `tok-push-bulk-${i}-${u.id}`,
    })),
  });

  // 8. Refresh Tokens (for role users)
  for (const role of roles) {
    await prisma.refreshToken.create({
      data: {
        userId: roleUsers[role].id,
        token: `${data.short}-${role.toLowerCase()}-refresh-token`,
        expiresAt: new Date('2027-01-01'),
      },
    });
  }

  // 9. Bulk Refresh Tokens
  console.log('-> Generating bulk refresh tokens...');
  await prisma.refreshToken.createMany({
    data: allUsers.map((u, i) => ({
      userId: u.id,
      token: `tok-refresh-bulk-${i}-${u.id}`,
      expiresAt: new Date('2028-01-01'),
    })),
  });

  // 10. Verification Codes
  await prisma.verificationCode.create({
    data: {
      userId: memberUser.id,
      code: '123456',
      type: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + 1000 * 60 * 10),
    },
  });

  // 11. Bulk Verification Codes
  console.log('-> Generating bulk verification codes...');
  await prisma.verificationCode.createMany({
    data: allUsers.slice(0, 500).map((u) => ({
      userId: u.id,
      code: String(100000 + Math.floor(Math.random() * 899999)),
      type: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    })),
  });

  // 12. Meeting (for role users)
  console.log('-> Creating meetings...');
  const meeting = await prisma.meeting.create({
    data: {
      associationId: association.id,
      title: `${data.short.toUpperCase()} Annual General Meeting`,
      type: MeetingType.GENERAL_MEETING,
      status: MeetingStatus.SCHEDULED,
      scheduledAt: new Date('2026-06-15T10:00:00Z'),
      venue: 'Shillong Convention Hall',
      createdById: superAdminUser.id,
    },
  });

  // 13. Bulk Meetings
  const meetingsToInsert: Prisma.MeetingCreateManyInput[] = [];
  for (let i = 1; i <= 1000; i++) {
    meetingsToInsert.push({
      associationId: association.id,
      title: `${data.short.toUpperCase()} Panel Session Cluster Ref-${i}`,
      type: i % 5 === 0 ? MeetingType.GENERAL_MEETING : MeetingType.EC_MEETING,
      status: i % 2 === 0 ? MeetingStatus.COMPLETED : MeetingStatus.SCHEDULED,
      scheduledAt: new Date(),
      venue: i % 2 === 0 ? 'Shillong Secretariat Auditorium' : 'Virtual Video Bridge Hub',
      createdById: superAdminUser.id,
    });
  }
  await prisma.meeting.createMany({ data: meetingsToInsert });
  const allMeetings = await prisma.meeting.findMany({
    where: { associationId: association.id },
    select: { id: true },
  });

  // 14. Meeting Attendees (role users)
  await prisma.meetingAttendee.createMany({
    data: [
      {
        meetingId: meeting.id,
        userId: roleUsers[UserRole.SUPER_ADMIN].id,
        attendeeRole: AttendeeRole.HOST,
        rsvpStatus: RsvpStatus.ACCEPTED,
        rsvpNote: 'Confirmed attendance',
        rsvpAt: new Date(),
        notifiedAt: new Date(),
      },
      ...roles
        .filter((role) => role !== UserRole.SUPER_ADMIN)
        .map((role) => ({
          meetingId: meeting.id,
          userId: roleUsers[role].id,
          attendeeRole: role === UserRole.SECRETARY ? AttendeeRole.CO_HOST : AttendeeRole.REQUIRED,
          rsvpStatus: RsvpStatus.PENDING,
          notifiedAt: new Date(),
        })),
    ],
  });

  // 15. Bulk Meeting Attendees
  console.log('-> Generating bulk meeting attendees...');
  const bulkUsers = allUsers.filter((u) => !roles.some((r) => roleUsers[r]?.id === u.id));
  const meetingAttendeeData = [];
  for (let i = 0; i < 1000; i++) {
    const m = allMeetings[i % allMeetings.length];
    const u = bulkUsers[i % bulkUsers.length];
    meetingAttendeeData.push({
      meetingId: m.id,
      userId: u.id,
      attendeeRole: AttendeeRole.REQUIRED,
      rsvpStatus: i % 3 === 0 ? RsvpStatus.ACCEPTED : RsvpStatus.PENDING,
      notifiedAt: new Date(),
    });
  }
  await prisma.meetingAttendee.createMany({ data: meetingAttendeeData });

  // 16. Agenda Items
  await prisma.agendaItem.createMany({
    data: [
      {
        meetingId: meeting.id,
        order: 1,
        title: 'Opening Remarks',
        description: 'President speech',
      },
      {
        meetingId: meeting.id,
        order: 2,
        title: 'Financial Report',
        description: 'Annual financial report',
      },
    ],
  });

  // 17. Bulk Agenda Items
  console.log('-> Generating bulk agenda items...');
  await prisma.agendaItem.createMany({
    data: Array.from({ length: 1000 }).map((_, i) => ({
      meetingId: getRandomElement(allMeetings).id,
      order: (i % 3) + 1,
      title: `Strategic Roadmap Blueprint Focus Segment Section-${i}`,
      description:
        'Review of organizational parameters, structural updates, and operations metrics framework parameters.',
    })),
  });

  // 18. Meeting Minutes
  await prisma.meetingMinutes.create({
    data: {
      meetingId: meeting.id,
      agendaPoint: 'Financial Report',
      decision: 'Budget approved unanimously',
      actionItems: [
        {
          assignee: financeUser.name,
          task: 'Prepare next quarter report',
        },
      ],
    },
  });

  // 19. Bulk Meeting Minutes
  console.log('-> Generating bulk meeting minutes...');
  await prisma.meetingMinutes.createMany({
    data: allMeetings.map((m, i) => ({
      meetingId: m.id,
      agendaPoint: 'Operations Status Tracking Performance Review',
      decision:
        'Operational modifications metrics framework authorization ratified across sectors safely.',
      actionItems: [
        {
          assignee: financeUser.name,
          task: `Execute optimization protocols phase code-${i}`,
        },
      ],
    })),
  });

  // 20. Training Module
  console.log('-> Creating training modules...');
  const trainingModule = await prisma.trainingModule.create({
    data: {
      associationId: association.id,
      title: 'Data Privacy Training',
      description: 'Mandatory compliance training',
      content: 'Training content goes here',
      durationMinutes: 45,
      requiredForRoles: [UserRole.MEMBER, UserRole.SECRETARY],
    },
  });

  // 21. Bulk Training Modules
  const trainingModulesToInsert: Prisma.TrainingModuleCreateManyInput[] = [];
  for (let i = 1; i <= 1000; i++) {
    trainingModulesToInsert.push({
      associationId: association.id,
      title: `Data Privacy Regulation Compliance Standard Version-${i}`,
      description:
        'Mandatory compliance evaluation program covering localized security data architectures.',
      content:
        'Complete framework curriculum instructions text content tracking data details block.',
      durationMinutes: 30 + (i % 90),
      requiredForRoles: [UserRole.MEMBER, UserRole.SECRETARY],
    });
  }
  await prisma.trainingModule.createMany({ data: trainingModulesToInsert });
  const allTrainingModules = await prisma.trainingModule.findMany({
    where: { associationId: association.id },
    select: { id: true },
  });

  // 22. Training Assignments (role users)
  await prisma.trainingAssignment.createMany({
    data: [
      {
        moduleId: trainingModule.id,
        userId: memberUser.id,
        status: TrainingAssignmentStatus.ASSIGNED,
        assignedAt: new Date(),
        dueDate: new Date('2026-12-31'),
        assignedById: superAdminUser.id,
      },
      {
        moduleId: trainingModule.id,
        userId: secretaryUser.id,
        status: TrainingAssignmentStatus.IN_PROGRESS,
        assignedAt: new Date(),
        dueDate: new Date('2026-12-31'),
        startedAt: new Date(),
        assignedById: superAdminUser.id,
      },
    ],
  });

  // 23. Bulk Training Assignments
  console.log('-> Generating bulk training assignments...');
  const trainingAssignmentData = [];
  for (let i = 0; i < 1000; i++) {
    const trainingModule = allTrainingModules[i % allTrainingModules.length];
    const user = bulkUsers[i % bulkUsers.length];
    trainingAssignmentData.push({
      moduleId: trainingModule.id,
      userId: user.id,
      status:
        i % 2 === 0 ? TrainingAssignmentStatus.IN_PROGRESS : TrainingAssignmentStatus.ASSIGNED,
      assignedAt: new Date(),
      dueDate: new Date('2026-12-31'),
      assignedById: superAdminUser.id,
    });
  }
  await prisma.trainingAssignment.createMany({ data: trainingAssignmentData });

  // 24. Training Completion (role user)
  await prisma.trainingCompletion.create({
    data: {
      moduleId: trainingModule.id,
      userId: secretaryUser.id,
      scorePercent: new Prisma.Decimal(95),
    },
  });

  // 25. Bulk Training Completions
  console.log('-> Generating bulk training completions...');
  const trainingCompletionData = [];
  for (let i = 0; i < 1000; i++) {
    const moduleIdx = Math.floor(i / 10) % allTrainingModules.length;
    const userIdx = i % bulkUsers.length;
    const trainingModule = allTrainingModules[moduleIdx];
    const user = bulkUsers[userIdx];
    trainingCompletionData.push({
      moduleId: trainingModule.id,
      userId: user.id,
      scorePercent: new Prisma.Decimal(75 + (i % 25)),
    });
  }
  await prisma.trainingCompletion.createMany({ data: trainingCompletionData });

  // 26. Announcement
  console.log('-> Creating announcements...');
  const announcement = await prisma.announcement.create({
    data: {
      associationId: association.id,
      authorId: roleUsers[UserRole.PRESIDENT].id,
      title: 'Annual Conference 2026',
      summary: 'Conference scheduled next month',
      content: 'Detailed conference information here',
      status: AnnouncementStatus.PUBLISHED,
      priority: AnnouncementPriority.HIGH,
      targetRoles: [UserRole.MEMBER],
      publishedAt: new Date(),
      isPinned: true,
    },
  });

  // 27. Bulk Announcements
  const announcementsToInsert: Prisma.AnnouncementCreateManyInput[] = [];
  for (let i = 1; i <= 1000; i++) {
    announcementsToInsert.push({
      associationId: association.id,
      authorId:
        getRandomElement(allUsers.filter((u) => !u.role.includes(UserRole.MEMBER)))?.id ||
        superAdminUser.id,
      title: `Strategic Directive Operations Circular Update-${i}`,
      summary: 'Review of local processing modifications adjustments guidelines updates.',
      content:
        'Complete detailed parameters documentation block concerning policy modification deployments across regional networks.',
      status: AnnouncementStatus.PUBLISHED,
      priority: i % 4 === 0 ? AnnouncementPriority.HIGH : AnnouncementPriority.NORMAL,
      targetRoles: [UserRole.MEMBER],
      publishedAt: new Date(),
      isPinned: i % 10 === 0,
    });
  }
  await prisma.announcement.createMany({ data: announcementsToInsert });
  const allAnnouncements = await prisma.announcement.findMany({
    where: { associationId: association.id },
    select: { id: true },
  });

  // 28. Announcement Read (role user)
  await prisma.announcementRead.create({
    data: {
      announcementId: announcement.id,
      userId: memberUser.id,
    },
  });

  // 29. Bulk Announcement Reads
  console.log('-> Generating bulk announcement reads...');
  const announcementReadData = [];
  for (let i = 0; i < 1000; i++) {
    const a = allAnnouncements[i % allAnnouncements.length];
    const u = bulkUsers[i % bulkUsers.length];
    announcementReadData.push({
      announcementId: a.id,
      userId: u.id,
    });
  }
  await prisma.announcementRead.createMany({ data: announcementReadData });

  // 30. Consent Receipt (role user)
  console.log('-> Creating consent receipts...');
  await prisma.consentReceipt.create({
    data: {
      associationId: association.id,
      userId: memberUser.id,
      purpose: ConsentPurpose.PAYMENTS,
      status: ConsentStatus.GRANTED,
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
      channel: 'web',
    },
  });

  // 31. Bulk Consent Receipts
  console.log('-> Generating bulk consent receipts...');
  await prisma.consentReceipt.createMany({
    data: Array.from({ length: 1000 }).map((_, i) => ({
      associationId: association.id,
      userId: getRandomElement(allUsers).id,
      purpose: i % 2 === 0 ? ConsentPurpose.PAYMENTS : ConsentPurpose.MARKETING,
      status: ConsentStatus.GRANTED,
      ipAddress: `192.168.1.${i % 254}`,
      userAgent: 'Mozilla/5.0 (Client Telemetry Device Engine System Connection)',
      channel: 'native-mobile',
    })),
  });

  // 32. DSAR Ticket (role user)
  console.log('-> Creating DSAR tickets...');
  const dsarTicket = await prisma.dsarTicket.create({
    data: {
      associationId: association.id,
      userId: memberUser.id,
      assignedToId: dpoUser.id,
      ticketNumber: `${data.short.toUpperCase()}-DSAR-001`,
      requestType: DsarRequestType.ACCESS,
      requestedData: ['Profile', 'Payments'],
      description: 'Need all personal data',
      status: DsarStatus.IN_PROGRESS,
    },
  });

  // 33. Bulk DSAR Tickets
  const dsarTicketsToInsert: Prisma.DsarTicketCreateManyInput[] = [];
  for (let i = 1; i <= 1000; i++) {
    dsarTicketsToInsert.push({
      associationId: association.id,
      userId: getRandomElement(allUsers).id,
      assignedToId: dpoUser.id,
      ticketNumber: `${data.short.toUpperCase()}-DSAR-REQ-${String(i).padStart(6, '0')}`,
      requestType: i % 2 === 0 ? DsarRequestType.ACCESS : DsarRequestType.DELETION,
      requestedData: ['ProfileInformation', 'PaymentLedgerHistoryRecords'],
      description:
        'Requesting localized verification transmission records export profile file download payload link.',
      status: i % 3 === 0 ? DsarStatus.COMPLETED : DsarStatus.IN_PROGRESS,
    });
  }
  await prisma.dsarTicket.createMany({ data: dsarTicketsToInsert });
  const allDsarTickets = await prisma.dsarTicket.findMany({
    where: { associationId: association.id },
    select: { id: true },
  });

  // 34. DSAR Response (role user ticket)
  await prisma.dsarResponse.create({
    data: {
      dsarTicketId: dsarTicket.id,
      responseType: 'ACCESS_EXPORT',
      deliveryMethod: 'secure_download',
      notes: 'Data exported successfully',
    },
  });

  // 35. Bulk DSAR Responses
  console.log('-> Generating bulk DSAR responses...');
  await prisma.dsarResponse.createMany({
    data: allDsarTickets.map((t) => ({
      dsarTicketId: t.id,
      responseType: 'SECURE_ARCHIVE_EXPORT_DISPATCH',
      deliveryMethod: 'encrypted_object_download_delivery',
      notes:
        'Telemetry bundle compiled successfully under secure protocol profiles keys verification parameters.',
    })),
  });

  // 36. Payment Transaction (role user)
  console.log('-> Creating payment transactions...');
  const payment = await prisma.paymentTransaction.create({
    data: {
      associationId: association.id,
      userId: memberUser.id,
      amount: new Prisma.Decimal(500),
      currency: 'INR',
      gateway: PaymentGateway.RAZORPAY,
      status: PaymentStatus.COMPLETED,
      method: PaymentMethod.UPI,
      referenceNumber: `${data.short}-payment-ref`,
      receiptNumber: `${data.short}-receipt-001`,
      razorpayOrderId: `${data.short}-order-id`,
      razorpayPaymentId: `${data.short}-payment-id`,
      razorpaySignature: 'signature',
      receiptUrl: 'https://example.com/receipt.pdf',
      invoiceUrl: 'https://example.com/invoice.pdf',
      paidAt: new Date(),
      paymentDate: new Date(),
      notes: 'Membership payment',
      createdById: financeUser.id,
      verifiedById: superAdminUser.id,
    },
  });

  // 37. Bulk Payment Transactions
  const paymentsToInsert: Prisma.PaymentTransactionCreateManyInput[] = [];
  for (let i = 1; i <= 1000; i++) {
    paymentsToInsert.push({
      associationId: association.id,
      userId: getRandomElement(allUsers).id,
      amount: new Prisma.Decimal(500 + (i % 5) * 250),
      currency: 'INR',
      gateway: PaymentGateway.RAZORPAY,
      status: PaymentStatus.COMPLETED,
      method: PaymentMethod.UPI,
      referenceNumber: `TXN-REF-${data.short.toUpperCase()}-${String(i).padStart(6, '0')}`,
      receiptNumber: `REC-${data.short.toUpperCase()}-${String(i).padStart(6, '0')}`,
      razorpayOrderId: `order_id_${data.short}_${String(i).padStart(6, '0')}`,
      razorpayPaymentId: `pay_id_${data.short}_${String(i).padStart(6, '0')}`,
      razorpaySignature: 'auth_crypto_signature_verification_string',
      receiptUrl: 'https://example.com/receipt.pdf',
      invoiceUrl: 'https://example.com/invoice.pdf',
      paidAt: new Date(),
      paymentDate: new Date(),
      notes: 'Membership regular subscription tracking fee processing.',
      createdById: financeUser.id,
      verifiedById: superAdminUser.id,
    });
  }
  await prisma.paymentTransaction.createMany({ data: paymentsToInsert });
  const allPayments = await prisma.paymentTransaction.findMany({
    where: { associationId: association.id },
    select: { id: true },
  });

  // 38. Contribution Period (role user)
  console.log('-> Creating contribution periods...');
  const contributionPeriod = await prisma.contributionPeriod.create({
    data: {
      associationId: association.id,
      userId: memberUser.id,
      year: 2026,
      month: 5,
      expectedAmount: new Prisma.Decimal(500),
      paidAmount: new Prisma.Decimal(500),
      dueAmount: new Prisma.Decimal(0),
      status: ContributionStatus.PAID,
      dueDate: new Date('2026-05-31'),
    },
  });

  // 39. Bulk Contribution Periods
  console.log('-> Generating bulk contribution periods...');
  const contributionPeriodData = [];
  const usedContributionKeys = new Set<string>();
  for (let i = 0; i < 1000; i++) {
    const user = allUsers[i % allUsers.length];
    const month = (i % 12) + 1;
    const year = 2026;
    const key = `${user.id}-${year}-${month}`;
    if (usedContributionKeys.has(key)) continue;
    usedContributionKeys.add(key);
    contributionPeriodData.push({
      associationId: association.id,
      userId: user.id,
      year,
      month,
      expectedAmount: new Prisma.Decimal(500),
      paidAmount: new Prisma.Decimal(500),
      dueAmount: new Prisma.Decimal(0),
      status: ContributionStatus.PAID,
      dueDate: new Date('2026-12-31'),
    });
  }
  await prisma.contributionPeriod.createMany({ data: contributionPeriodData });
  const allPeriods = await prisma.contributionPeriod.findMany({
    where: { associationId: association.id },
    select: { id: true },
  });

  // 40. Payment Allocation (role user)
  await prisma.paymentAllocation.create({
    data: {
      paymentTransactionId: payment.id,
      contributionPeriodId: contributionPeriod.id,
      allocatedAmount: new Prisma.Decimal(500),
    },
  });

  // 41. Bulk Payment Allocations
  console.log('-> Generating bulk payment allocations...');
  const paymentAllocationData = [];
  const allocCount = Math.min(allPayments.length, allPeriods.length, 1000);
  for (let i = 0; i < allocCount; i++) {
    paymentAllocationData.push({
      paymentTransactionId: allPayments[i].id,
      contributionPeriodId: allPeriods[i % allPeriods.length].id,
      allocatedAmount: new Prisma.Decimal(500),
    });
  }
  await prisma.paymentAllocation.createMany({ data: paymentAllocationData });

  // 42. Payment Webhook Event
  console.log('-> Creating payment webhook events...');
  await prisma.paymentWebhookEvent.create({
    data: {
      eventId: `${data.short}-event-001`,
      eventType: 'payment.captured',
      gateway: PaymentGateway.RAZORPAY,
      payload: {
        success: true,
      },
      signature: 'webhook-signature',
      processed: true,
      processedAt: new Date(),
    },
  });

  // 43. Bulk Payment Webhook Events
  console.log('-> Generating bulk webhook events...');
  await prisma.paymentWebhookEvent.createMany({
    data: Array.from({ length: 1000 }).map((_, i) => ({
      eventId: `evt_rzp_telemetry_id_string_${i}_${data.short}`,
      eventType: 'payment.captured',
      gateway: PaymentGateway.RAZORPAY,
      payload: { system_validated: true, reference: i },
      signature: 'webhook_payload_security_authentication_hash',
      processed: true,
      processedAt: new Date(),
    })),
  });

  // 44. Ledger Entry (role user)
  console.log('-> Creating ledger entries...');
  const ledgerEntry = await prisma.ledgerEntry.create({
    data: {
      paymentTransactionId: payment.id,
      description: 'Membership fee ledger entry',
      approvalStatus: 'APPROVED',
      createdById: financeUser.id,
      approvedById: superAdminUser.id,
    },
  });

  // 45. Ledger Lines (role user)
  await prisma.ledgerLine.createMany({
    data: [
      {
        ledgerEntryId: ledgerEntry.id,
        accountId: 'cash-account',
        isDebit: true,
        amount: new Prisma.Decimal(500),
      },
      {
        ledgerEntryId: ledgerEntry.id,
        accountId: 'membership-income',
        isDebit: false,
        amount: new Prisma.Decimal(500),
      },
    ],
  });

  // 46. Bulk Ledger Entries
  console.log('-> Generating bulk ledger entries...');
  await prisma.ledgerEntry.createMany({
    data: allPayments.map((p, i) => ({
      paymentTransactionId: p.id,
      description: `Double-entry configuration alignment balancing ledger profile node item-${i}`,
      approvalStatus: 'APPROVED',
      createdById: financeUser.id,
      approvedById: superAdminUser.id,
    })),
  });
  const allLedgerEntries = await prisma.ledgerEntry.findMany({
    select: { id: true },
  });

  // 47. Bulk Ledger Lines
  console.log('-> Generating bulk ledger lines...');
  const ledgerLines: Prisma.LedgerLineCreateManyInput[] = [];
  for (let i = 0; i < allLedgerEntries.length; i++) {
    const entryId = allLedgerEntries[i].id;
    ledgerLines.push(
      {
        ledgerEntryId: entryId,
        accountId: 'assets-cash-operational-pool',
        isDebit: true,
        amount: new Prisma.Decimal(500),
      },
      {
        ledgerEntryId: entryId,
        accountId: 'revenues-membership-dues-pool',
        isDebit: false,
        amount: new Prisma.Decimal(500),
      },
    );
  }
  await prisma.ledgerLine.createMany({ data: ledgerLines });

  // 48. Notification (role user)
  console.log('-> Creating notifications...');
  await prisma.notification.create({
    data: {
      associationId: association.id,
      userId: memberUser.id,
      title: 'Payment Successful',
      body: 'Your membership payment was successful',
      type: NotificationType.SYSTEM,
      route: '/payments',
      entityId: payment.id,
      isRead: false,
      isReceived: true,
      receivedAt: new Date(),
    },
  });

  // 49. Bulk Notifications
  console.log('-> Generating bulk notifications...');
  await prisma.notification.createMany({
    data: Array.from({ length: 1000 }).map((_, i) => ({
      associationId: association.id,
      userId: getRandomElement(allUsers).id,
      title: 'System Update Notification Event Alert',
      body: 'An update event profile operation modification transaction has run securely against your user registry space.',
      type: NotificationType.SYSTEM,
      route: '/dashboard/telemetry/profile',
      entityId: getRandomElement(allPayments).id,
      isRead: i % 4 === 0,
      isReceived: true,
      receivedAt: new Date(),
    })),
  });

  // 50. Complaint (role user)
  console.log('-> Creating complaints...');
  await prisma.complaint.create({
    data: {
      associationId: association.id,
      userId: memberUser.id,
      category: ComplaintCategory.PAYMENT_DISPUTE,
      subject: 'Unable to download receipt',
      description: 'Receipt PDF download failing',
      status: ComplaintStatus.OPEN,
      priority: 'HIGH',
      assignedToId: secretaryUser.id,
    },
  });

  // 51. Bulk Complaints
  console.log('-> Generating bulk complaints...');
  const complaintsToInsert: Prisma.ComplaintCreateManyInput[] = [];
  for (let i = 1; i <= 1000; i++) {
    complaintsToInsert.push({
      associationId: association.id,
      userId: getRandomElement(allUsers).id,
      category: ComplaintCategory.ADMINISTRATIVE,
      subject: `Operational Processing Connection Failure interface-${i}`,
      description:
        'User interaction tracking dashboard telemetry object structural parameters parsing delays.',
      status: i % 3 === 0 ? ComplaintStatus.RESOLVED : ComplaintStatus.OPEN,
      priority: i % 5 === 0 ? 'HIGH' : 'MEDIUM',
      assignedToId: secretaryUser.id,
    });
  }
  await prisma.complaint.createMany({ data: complaintsToInsert });

  // 52. Payment Provider
  console.log('-> Creating payment provider...');
  await prisma.paymentProvider.create({
    data: {
      associationId: association.id,
      provider: 'RAZORPAY',
      keyId: encKeyId,
      encryptedKeySecret: encSecret,
      encryptedWebhookSecret: encWebhook,
      isActive: true,
    },
  });

  // 53. Audit Log (role user)
  console.log('-> Creating audit logs...');
  await prisma.auditLog.create({
    data: {
      associationId: association.id,
      actorId: superAdminUser.id,
      action: 'CREATE',
      resourceType: 'Association',
      resourceId: association.id,
      newValues: {
        name: data.name,
        slug: data.slug,
      },
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
      traceId: `${data.short}-trace-001`,
    },
  });

  // 54. Bulk Audit Logs
  console.log('-> Generating bulk audit logs...');
  const auditsToInsert: Prisma.AuditLogCreateManyInput[] = [];
  for (let i = 1; i <= 1000; i++) {
    auditsToInsert.push({
      associationId: association.id,
      actorId: getRandomElement(allUsers).id,
      action: 'UPDATE',
      resourceType: 'OperationalDatabaseNodeRecord',
      resourceId: association.id,
      newValues: {
        validationTimestamp: new Date().toISOString(),
        traceIndex: i,
      },
      ipAddress: `10.0.4.${i % 254}`,
      userAgent: 'Security Execution Runner Script Engine Connection Process',
      traceId: `trc-uuid-string-generation-block-${i}-${association.id.slice(0, 8)}`,
    });
  }
  await prisma.auditLog.createMany({ data: auditsToInsert });

  // 55. Compliance Check
  console.log('-> Creating compliance checks...');
  await prisma.complianceCheck.create({
    data: {
      associationId: association.id,
      checkType: 'GDPR_CHECK',
      status: ComplianceCheckStatus.PASSED,
      score: 96,
      message: 'Association compliant',
      details: {
        encryption: true,
      },
      recommendations: {
        rotateKeys: true,
      },
    },
  });

  // 56. Bulk Compliance Checks
  console.log('-> Generating bulk compliance checks...');
  const complianceChecksToInsert: Prisma.ComplianceCheckCreateManyInput[] = [];
  for (let i = 1; i <= 1000; i++) {
    complianceChecksToInsert.push({
      associationId: association.id,
      checkType: 'REGULATORY_SYSTEM_DATA_INTEGRITY_AUDIT',
      status: ComplianceCheckStatus.PASSED,
      score: 90 + (i % 11),
      message: 'Data system validation checks matching architecture specifications.',
      details: { automatedVerificationCodeRun: true, operationalCheckIdx: i },
      recommendations: { routineLogRotationIntervalDays: 30 },
    });
  }
  await prisma.complianceCheck.createMany({ data: complianceChecksToInsert });

  // 57. ADDITIONAL USERS (status coverage)
  console.log('-> Creating additional users for status coverage...');
  // Create a user for each status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statusCoverageUsers: Record<string, any> = {};
  for (const status of [
    UserStatus.INACTIVE,
    UserStatus.SUSPENDED,
    UserStatus.ANONYMIZED,
    UserStatus.PENDING,
  ]) {
    const user = await prisma.user.create({
      data: {
        associationId: association.id,
        email: `${status.toLowerCase()}@${data.short}.org`,
        name: `${data.short.toUpperCase()} ${status} User`,
        mobile: '9999999999',
        designation: `${status} Designation`,
        role: [UserRole.MEMBER],
        password: basePassword,
        status,
        membershipNumber: `${data.short.toUpperCase()}-${status}`,
        imageUrl: 'https://placehold.co/300x300',
        mfaEnabled: false,
        memberTypeId: createdMemberTypes[0]?.id,
      },
    });
    statusCoverageUsers[status] = user;
  }

  // 58. ADDITIONAL MEETINGS (status/type coverage)
  console.log('-> Creating additional meetings for status coverage...');
  const [noticeMeeting, cancelledMeeting] = await Promise.all([
    prisma.meeting.create({
      data: {
        associationId: association.id,
        title: `${data.short.toUpperCase()} Emergency EC Meeting`,
        type: MeetingType.EC_MEETING,
        status: MeetingStatus.NOTICE_ISSUED,
        scheduledAt: new Date('2026-07-01T10:00:00Z'),
        noticeIssuedAt: new Date(),
        venue: 'Virtual Bridge',
        createdById: superAdminUser.id,
      },
    }),
    prisma.meeting.create({
      data: {
        associationId: association.id,
        title: `${data.short.toUpperCase()} Postponed Session`,
        type: MeetingType.GENERAL_MEETING,
        status: MeetingStatus.CANCELLED,
        scheduledAt: new Date('2025-01-01T10:00:00Z'),
        venue: 'Shillong Convention Hall',
        createdById: superAdminUser.id,
      },
    }),
  ]);
  const additionalMeetings = [noticeMeeting, cancelledMeeting];

  // 59. ADDITIONAL MEETING ATTENDEES (role/rsvp coverage)
  console.log('-> Creating additional meeting attendees for coverage...');
  for (const meeting of additionalMeetings) {
    await prisma.meetingAttendee.createMany({
      data: [
        {
          meetingId: meeting.id,
          userId: superAdminUser.id,
          attendeeRole: AttendeeRole.HOST,
          rsvpStatus: RsvpStatus.ACCEPTED,
          rsvpAt: new Date(),
          notifiedAt: new Date(),
        },
        {
          meetingId: meeting.id,
          userId: secretaryUser.id,
          attendeeRole: AttendeeRole.CO_HOST,
          rsvpStatus: RsvpStatus.PENDING,
          notifiedAt: new Date(),
        },
        {
          meetingId: meeting.id,
          userId: memberUser.id,
          attendeeRole: AttendeeRole.OPTIONAL,
          rsvpStatus: RsvpStatus.DECLINED,
          rsvpNote: 'Schedule conflict',
          rsvpAt: new Date(),
          notifiedAt: new Date(),
        },
      ],
    });
  }

  // 60. ADDITIONAL CONSENT RECEIPTS (purpose/status coverage)
  console.log('-> Creating additional consent receipts...');
  await prisma.consentReceipt.createMany({
    data: [
      {
        associationId: association.id,
        userId: memberUser.id,
        purpose: ConsentPurpose.COMMUNICATIONS,
        status: ConsentStatus.GRANTED,
        channel: 'web',
      },
      {
        associationId: association.id,
        userId: memberUser.id,
        purpose: ConsentPurpose.MEETINGS,
        status: ConsentStatus.GRANTED,
        channel: 'email',
      },
      {
        associationId: association.id,
        userId: memberUser.id,
        purpose: ConsentPurpose.ANALYTICS,
        status: ConsentStatus.WITHDRAWN,
        channel: 'web',
        metadata: { withdrawnAt: new Date().toISOString() },
      },
      {
        associationId: association.id,
        userId: memberUser.id,
        purpose: ConsentPurpose.MARKETING,
        status: ConsentStatus.WITHDRAWN,
        channel: 'web',
      },
    ],
  });

  // 61. ADDITIONAL DSAR TICKETS (type/status coverage)
  console.log('-> Creating additional DSAR tickets...');
  await prisma.dsarTicket.createMany({
    data: [
      {
        associationId: association.id,
        userId: memberUser.id,
        assignedToId: dpoUser.id,
        ticketNumber: `${data.short.toUpperCase()}-DSAR-CORR-001`,
        requestType: DsarRequestType.CORRECTION,
        requestedData: ['Profile'],
        description: 'Correct my name',
        status: DsarStatus.PENDING,
      },
      {
        associationId: association.id,
        userId: memberUser.id,
        assignedToId: dpoUser.id,
        ticketNumber: `${data.short.toUpperCase()}-DSAR-PORT-001`,
        requestType: DsarRequestType.PORTABILITY,
        requestedData: ['All'],
        description: 'Export all data',
        status: DsarStatus.REJECTED,
        rejectedReason: 'Duplicate request',
      },
    ],
  });

  // 62. ADDITIONAL PAYMENT TRANSACTIONS (status/method/gateway coverage)
  console.log('-> Creating additional payment transactions...');
  await prisma.paymentTransaction.createMany({
    data: [
      {
        associationId: association.id,
        userId: memberUser.id,
        amount: new Prisma.Decimal(500),
        currency: 'INR',
        gateway: PaymentGateway.RAZORPAY,
        status: PaymentStatus.PENDING,
        method: PaymentMethod.UPI,
        referenceNumber: `${data.short}-pending-ref`,
        createdById: financeUser.id,
        paymentDate: new Date(),
      },
      {
        associationId: association.id,
        userId: memberUser.id,
        amount: new Prisma.Decimal(500),
        currency: 'INR',
        gateway: PaymentGateway.RAZORPAY,
        status: PaymentStatus.FAILED,
        method: PaymentMethod.UPI,
        referenceNumber: `${data.short}-failed-ref`,
        failedAt: new Date(),
        createdById: financeUser.id,
        paymentDate: new Date(),
        notes: 'Insufficient funds',
      },
      {
        associationId: association.id,
        userId: memberUser.id,
        amount: new Prisma.Decimal(500),
        currency: 'INR',
        gateway: PaymentGateway.RAZORPAY,
        status: PaymentStatus.REFUNDED,
        method: PaymentMethod.ONLINE,
        referenceNumber: `${data.short}-refunded-ref`,
        razorpayRefundId: `${data.short}-refund-id`,
        paidAt: new Date(),
        createdById: financeUser.id,
        verifiedById: superAdminUser.id,
        paymentDate: new Date(),
      },
      {
        associationId: association.id,
        userId: memberUser.id,
        amount: new Prisma.Decimal(500),
        currency: 'INR',
        gateway: PaymentGateway.MANUAL,
        status: PaymentStatus.WAIVED,
        method: PaymentMethod.CASH,
        referenceNumber: `${data.short}-waived-ref`,
        createdById: financeUser.id,
        verifiedById: superAdminUser.id,
        paymentDate: new Date(),
        notes: 'Fee waived by president',
      },
      {
        associationId: association.id,
        userId: secretaryUser.id,
        amount: new Prisma.Decimal(1000),
        currency: 'INR',
        gateway: PaymentGateway.MANUAL,
        status: PaymentStatus.COMPLETED,
        method: PaymentMethod.BANK_TRANSFER,
        referenceNumber: `${data.short}-bank-ref`,
        createdById: financeUser.id,
        verifiedById: superAdminUser.id,
        paymentDate: new Date(),
      },
      {
        associationId: association.id,
        userId: secretaryUser.id,
        amount: new Prisma.Decimal(200),
        currency: 'INR',
        gateway: PaymentGateway.RAZORPAY,
        status: PaymentStatus.COMPLETED,
        method: PaymentMethod.CHEQUE,
        referenceNumber: `${data.short}-cheque-ref`,
        createdById: financeUser.id,
        verifiedById: superAdminUser.id,
        paymentDate: new Date(),
      },
    ],
  });

  // 63. ADDITIONAL CONTRIBUTION PERIODS (status coverage)
  console.log('-> Creating additional contribution periods...');
  await prisma.contributionPeriod.createMany({
    data: [
      {
        associationId: association.id,
        userId: memberUser.id,
        year: 2025,
        month: 1,
        expectedAmount: new Prisma.Decimal(500),
        paidAmount: new Prisma.Decimal(0),
        dueAmount: new Prisma.Decimal(500),
        status: ContributionStatus.DUE,
        dueDate: new Date('2025-01-31'),
      },
      {
        associationId: association.id,
        userId: memberUser.id,
        year: 2025,
        month: 2,
        expectedAmount: new Prisma.Decimal(500),
        paidAmount: new Prisma.Decimal(250),
        dueAmount: new Prisma.Decimal(250),
        status: ContributionStatus.PARTIAL,
        dueDate: new Date('2025-02-28'),
      },
      {
        associationId: association.id,
        userId: memberUser.id,
        year: 2025,
        month: 3,
        expectedAmount: new Prisma.Decimal(500),
        paidAmount: new Prisma.Decimal(0),
        dueAmount: new Prisma.Decimal(500),
        status: ContributionStatus.OVERDUE,
        dueDate: new Date('2025-03-31'),
      },
      {
        associationId: association.id,
        userId: secretaryUser.id,
        year: 2025,
        month: 1,
        expectedAmount: new Prisma.Decimal(500),
        paidAmount: new Prisma.Decimal(0),
        dueAmount: new Prisma.Decimal(0),
        status: ContributionStatus.WAIVED,
        dueDate: new Date('2025-01-31'),
        waivedAt: new Date(),
        waivedReason: 'Hardship waiver',
      },
    ],
  });

  // 64. ADDITIONAL COMPLAINTS (status coverage)
  console.log('-> Creating additional complaints...');
  await prisma.complaint.createMany({
    data: [
      {
        associationId: association.id,
        userId: memberUser.id,
        category: ComplaintCategory.OTHER,
        subject: 'App login issue',
        description: 'Unable to login to mobile app',
        status: ComplaintStatus.IN_PROGRESS,
        priority: 'HIGH',
        assignedToId: secretaryUser.id,
      },
      {
        associationId: association.id,
        userId: secretaryUser.id,
        category: ComplaintCategory.PAYMENT_DISPUTE,
        subject: 'Duplicate payment',
        description: 'Payment was deducted twice',
        status: ComplaintStatus.CLOSED,
        priority: 'URGENT',
        assignedToId: financeUser.id,
        resolvedAt: new Date(),
      },
    ],
  });

  // 65. ADDITIONAL COMPLIANCE CHECKS (status coverage)
  console.log('-> Creating additional compliance checks...');
  await prisma.complianceCheck.createMany({
    data: [
      {
        associationId: association.id,
        checkType: 'DATA_RETENTION_AUDIT',
        status: ComplianceCheckStatus.FAILED,
        score: 45,
        message: 'Expired user data not purged',
        details: { expiredRecords: 234 },
        recommendations: { scheduleCleanup: true },
      },
      {
        associationId: association.id,
        checkType: 'ENCRYPTION_VERIFICATION',
        status: ComplianceCheckStatus.WARNING,
        score: 75,
        message: 'Some fields use weak encryption',
        details: { weakFields: ['mobile'] },
        recommendations: { upgradeAlgorithm: 'AES-256-GCM' },
      },
      {
        associationId: association.id,
        checkType: 'THIRD_PARTY_AUDIT',
        status: ComplianceCheckStatus.SKIPPED,
        score: 0,
        message: 'Audit not applicable this quarter',
        details: { reason: 'No third-party processors active' },
      },
    ],
  });

  // 66. ADDITIONAL TRAINING ASSIGNMENTS (status coverage)
  console.log('-> Creating additional training assignments...');
  const additionalModule = allTrainingModules[0];
  if (additionalModule) {
    await prisma.trainingAssignment.createMany({
      data: [
        {
          moduleId: additionalModule.id,
          userId: dpoUser.id,
          status: TrainingAssignmentStatus.COMPLETED,
          assignedAt: new Date(),
          dueDate: new Date('2026-06-01'),
          completedAt: new Date(),
          assignedById: superAdminUser.id,
        },
        {
          moduleId: additionalModule.id,
          userId: financeUser.id,
          status: TrainingAssignmentStatus.OVERDUE,
          assignedAt: new Date('2026-01-01'),
          dueDate: new Date('2026-03-01'),
          assignedById: superAdminUser.id,
        },
        {
          moduleId: additionalModule.id,
          userId: superAdminUser.id,
          status: TrainingAssignmentStatus.EXEMPT,
          assignedAt: new Date(),
          dueDate: new Date('2026-12-31'),
          assignedById: superAdminUser.id,
          notes: 'Already certified',
        },
      ],
    });
  }

  // 67. ADDITIONAL NOTIFICATIONS (type coverage)
  console.log('-> Creating additional notifications...');
  await prisma.notification.createMany({
    data: [
      {
        associationId: association.id,
        userId: memberUser.id,
        title: 'Welcome to MFSA',
        body: 'Thanks for joining!',
        type: NotificationType.GENERAL_MESSAGE,
        route: '/dashboard',
        entityId: memberUser.id,
        isRead: false,
        isReceived: true,
        receivedAt: new Date(),
      },
      {
        associationId: association.id,
        userId: memberUser.id,
        title: 'New follower',
        body: 'Secretary started following you',
        type: NotificationType.FOLLOW,
        route: '/profile',
        entityId: secretaryUser.id,
        isRead: false,
        isReceived: true,
        receivedAt: new Date(),
      },
    ],
  });

  // 68. ADDITIONAL ANNOUNCEMENTS (status/priority coverage)
  console.log('-> Creating additional announcements...');
  await prisma.announcement.createMany({
    data: [
      {
        associationId: association.id,
        authorId: roleUsers[UserRole.PRESIDENT].id,
        title: 'Draft Budget Proposal',
        summary: 'Under review',
        content: 'Draft content...',
        status: AnnouncementStatus.DRAFT,
        priority: AnnouncementPriority.LOW,
        targetRoles: [UserRole.MEMBER],
        publishedAt: null,
      },
      {
        associationId: association.id,
        authorId: roleUsers[UserRole.PRESIDENT].id,
        title: 'Upcoming Elections',
        summary: 'Scheduled announcement',
        content: 'Election details...',
        status: AnnouncementStatus.SCHEDULED,
        priority: AnnouncementPriority.URGENT,
        targetRoles: [UserRole.MEMBER],
        publishedAt: new Date('2026-08-01'),
      },
      {
        associationId: association.id,
        authorId: roleUsers[UserRole.PRESIDENT].id,
        title: 'Old Notice 2025',
        summary: 'Archived notice',
        content: 'Archive content...',
        status: AnnouncementStatus.ARCHIVED,
        priority: AnnouncementPriority.NORMAL,
        targetRoles: [UserRole.MEMBER],
        publishedAt: new Date('2025-01-01'),
      },
    ],
  });

  // 69. ADDITIONAL AUDIT LOGS (action coverage)
  console.log('-> Creating additional audit logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        associationId: association.id,
        actorId: memberUser.id,
        action: AuditAction.LOGIN,
        resourceType: 'Session',
        ipAddress: '192.168.1.1',
        userAgent: 'mobile-app',
      },
      {
        associationId: association.id,
        actorId: memberUser.id,
        action: AuditAction.CONSENT_REVOKE,
        resourceType: 'ConsentReceipt',
        resourceId: 'analytics-consent',
        newValues: { purpose: 'ANALYTICS', status: 'WITHDRAWN' },
        ipAddress: '192.168.1.1',
      },
      {
        associationId: association.id,
        actorId: dpoUser.id,
        action: AuditAction.ANONYMIZE,
        resourceType: 'User',
        resourceId: statusCoverageUsers[UserStatus.ANONYMIZED]?.id,
        newValues: { anonymized: true },
      },
      {
        associationId: association.id,
        actorId: secretaryUser.id,
        action: AuditAction.MEETING_ASSIGN,
        resourceType: 'MeetingAttendee',
        resourceId: noticeMeeting?.id,
        ipAddress: '10.0.0.1',
      },
      {
        associationId: association.id,
        actorId: secretaryUser.id,
        action: AuditAction.MEETING_RSVP,
        resourceType: 'RsvpStatus',
        newValues: { status: 'DECLINED' },
        ipAddress: '10.0.0.1',
      },
      {
        associationId: association.id,
        actorId: financeUser.id,
        action: AuditAction.PAYMENT_REFUNDED,
        resourceType: 'PaymentTransaction',
        newValues: { status: 'REFUNDED' },
      },
      {
        associationId: association.id,
        actorId: superAdminUser.id,
        action: AuditAction.ROLE_CHANGE,
        resourceType: 'User',
        resourceId: memberUser.id,
        oldValues: { role: ['MEMBER'] },
        newValues: { role: ['MEMBER', 'SECRETARY'] },
      },
      {
        associationId: association.id,
        actorId: superAdminUser.id,
        action: AuditAction.SUBSCRIPTION_CHANGE,
        resourceType: 'Subscription',
        newValues: { plan: 'Tier 2', status: 'ACTIVE' },
      },
      {
        associationId: association.id,
        actorId: superAdminUser.id,
        action: AuditAction.REPORT_EXPORTED,
        resourceType: 'Report',
        newValues: { reportType: 'annual_financial' },
      },
    ],
  });

  // 70. MEMBERSHIP APPLICATIONS
  console.log('-> Creating membership applications...');
  await prisma.membershipApplication.createMany({
    data: [
      {
        email: 'pending@example.com',
        phone: '9000000001',
        associationSlug: data.slug,
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        age: 36,
        gender: 'Male',
        address: 'Shillong',
        city: 'Shillong',
        state: 'Meghalaya',
        country: 'IN',
        postalCode: '793001',
        status: ApplicationStatus.PENDING,
      },
      {
        email: 'approved@example.com',
        phone: '9000000002',
        associationSlug: data.slug,
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: new Date('1985-05-15'),
        age: 41,
        gender: 'Female',
        address: 'Tura',
        city: 'Tura',
        state: 'Meghalaya',
        country: 'IN',
        postalCode: '794001',
        status: ApplicationStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedBy: superAdminUser.id,
      },
      {
        email: 'rejected@example.com',
        phone: '9000000003',
        associationSlug: data.slug,
        firstName: 'Bob',
        lastName: 'Johnson',
        dateOfBirth: new Date('2000-12-25'),
        age: 25,
        gender: 'Male',
        address: 'Nongstoin',
        city: 'Nongstoin',
        state: 'Meghalaya',
        country: 'IN',
        postalCode: '793109',
        status: ApplicationStatus.REJECTED,
        rejectionReason: 'Does not meet eligibility criteria',
        reviewedAt: new Date(),
        reviewedBy: superAdminUser.id,
      },
    ],
  });

  // 71. SUBSCRIPTION BILLING HISTORY
  console.log('-> Creating subscription billing history...');
  const memberSub = await prisma.subscription.findUnique({
    where: { userId: memberUser.id },
  });
  if (memberSub) {
    await prisma.subscriptionBillingHistory.createMany({
      data: [
        {
          subscriptionId: memberSub.id,
          planVersionId: subscriptionPlans[0].versions[0].id,
          amountCharged: new Prisma.Decimal(500),
          status: 'PAID',
          periodStart: new Date('2026-01-01'),
          periodEnd: new Date('2026-01-31'),
          dueDate: new Date('2026-01-15'),
        },
        {
          subscriptionId: memberSub.id,
          planVersionId: subscriptionPlans[0].versions[0].id,
          amountCharged: new Prisma.Decimal(500),
          status: 'PAID',
          periodStart: new Date('2026-02-01'),
          periodEnd: new Date('2026-02-28'),
          dueDate: new Date('2026-02-15'),
        },
        {
          subscriptionId: memberSub.id,
          planVersionId: subscriptionPlans[0].versions[0].id,
          amountCharged: new Prisma.Decimal(500),
          status: 'PENDING',
          periodStart: new Date('2026-03-01'),
          periodEnd: new Date('2026-03-31'),
          dueDate: new Date('2026-03-15'),
        },
      ],
    });
  }

  // 72. ACCOUNTS (Chart of Accounts)
  console.log('-> Creating chart of accounts...');
  await prisma.account.createMany({
    data: [
      {
        associationId: association.id,
        code: '1001',
        name: 'Cash in Hand',
        type: 'ASSET',
        description: 'Physical cash',
        isActive: true,
      },
      {
        associationId: association.id,
        code: '1002',
        name: 'Bank Account',
        type: 'ASSET',
        description: 'Main bank account',
        isActive: true,
      },
      {
        associationId: association.id,
        code: '2001',
        name: 'Membership Dues Receivable',
        type: 'ASSET',
        description: 'Outstanding member contributions',
        isActive: true,
      },
      {
        associationId: association.id,
        code: '3001',
        name: 'Membership Income',
        type: 'REVENUE',
        description: 'Subscription fees',
        isActive: true,
      },
      {
        associationId: association.id,
        code: '3002',
        name: 'Event Fees',
        type: 'REVENUE',
        description: 'Income from events',
        isActive: true,
      },
      {
        associationId: association.id,
        code: '4001',
        name: 'Operating Expenses',
        type: 'EXPENSE',
        description: 'General operating costs',
        isActive: true,
      },
    ],
  });

  // 73. FILES
  console.log('-> Creating files...');
  await prisma.file.createMany({
    data: [
      {
        associationId: association.id,
        originalName: 'annual_report_2025.pdf',
        storedName: 'reports/2025/annual_report.pdf',
        mimeType: 'application/pdf',
        extension: 'pdf',
        sizeBytes: 2048576,
        storageKey: 'reports/2025/annual_report.pdf',
        url: 'https://storage.example.com/reports/2025/annual_report.pdf',
        checksum: 'abc123',
      },
      {
        associationId: association.id,
        originalName: 'logo.png',
        storedName: 'assets/logo.png',
        mimeType: 'image/png',
        extension: 'png',
        sizeBytes: 24576,
        storageKey: 'assets/logo.png',
        url: 'https://storage.example.com/assets/logo.png',
        width: 300,
        height: 300,
        checksum: 'def456',
      },
      {
        associationId: association.id,
        originalName: 'welcome_video.mp4',
        storedName: 'media/welcome.mp4',
        mimeType: 'video/mp4',
        extension: 'mp4',
        sizeBytes: 52428800,
        storageKey: 'media/welcome.mp4',
        url: 'https://storage.example.com/media/welcome.mp4',
        durationSeconds: 120,
        checksum: 'ghi789',
      },
      {
        associationId: association.id,
        originalName: 'budget_2026.xlsx',
        storedName: 'finance/budget_2026.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx',
        sizeBytes: 102400,
        storageKey: 'finance/budget_2026.xlsx',
        url: 'https://storage.example.com/finance/budget_2026.xlsx',
        checksum: 'jkl012',
      },
    ],
  });

  // 74. LOGS
  console.log('-> Creating system logs...');
  await prisma.log.createMany({
    data: [
      {
        type: 'info',
        message: 'Seed completed successfully',
        content: { duration: '2.3s', recordsCreated: 15000 },
        isBackend: true,
      },
      {
        type: 'warn',
        message: 'Rate limit approaching',
        content: {
          endpoint: '/api/payments',
          requestsPerMinute: 85,
          limit: 100,
        },
        isBackend: true,
      },
      {
        type: 'error',
        message: 'Payment gateway timeout',
        content: { gateway: 'RAZORPAY', orderId: 'order_123', retryCount: 3 },
        isBackend: true,
      },
      {
        type: 'info',
        message: 'User login successful',
        content: { userId: memberUser.id, ip: '192.168.1.1' },
        isBackend: false,
      },
    ],
  });

  // 75. TRAINING SUPPLEMENTS
  console.log('-> Creating training supplements...');
  if (additionalModule) {
    await prisma.trainingSupplement.createMany({
      data: [
        {
          moduleId: additionalModule.id,
          title: 'Slides - Data Privacy Basics',
          description: 'Presentation slides for module 1',
          downloadUrl: 'https://storage.example.com/supplements/slides.pdf',
          thumbnailUrl: 'https://storage.example.com/supplements/slides-thumb.png',
          isActive: true,
        },
        {
          moduleId: additionalModule.id,
          title: 'Case Studies Document',
          description: 'Real-world privacy scenarios',
          downloadUrl: 'https://storage.example.com/supplements/case-studies.pdf',
          isActive: true,
        },
        {
          moduleId: additionalModule.id,
          title: 'Quick Reference Card',
          description: 'One-page summary',
          downloadUrl: 'https://storage.example.com/supplements/quickref.pdf',
          isActive: true,
        },
        {
          moduleId: additionalModule.id,
          title: 'Video Walkthrough',
          description: 'Archived recording',
          downloadUrl: 'https://storage.example.com/supplements/walkthrough.mp4',
          isActive: false,
        },
      ],
    });
  }

  // 76. TRAINING CERTIFICATES
  console.log('-> Creating training certificates...');
  if (additionalModule) {
    await prisma.trainingCertificate.createMany({
      data: [
        {
          userId: secretaryUser.id,
          moduleId: additionalModule.id,
          certificateNumber: `${data.short.toUpperCase()}-CERT-001`,
          certificateUrl: 'https://storage.example.com/certs/001.pdf',
          thumbnailUrl: 'https://storage.example.com/certs/001-thumb.png',
        },
        {
          userId: dpoUser.id,
          moduleId: additionalModule.id,
          certificateNumber: `${data.short.toUpperCase()}-CERT-002`,
          certificateUrl: 'https://storage.example.com/certs/002.pdf',
        },
        {
          userId: financeUser.id,
          moduleId: additionalModule.id,
          certificateNumber: `${data.short.toUpperCase()}-CERT-003`,
          certificateUrl: 'https://storage.example.com/certs/003.pdf',
        },
      ],
    });
  }

  // 77. REALISTIC PAYMENTS (different days across months)
  console.log('-> Creating realistic payments spread across dates...');
  const realisticPayments: Prisma.PaymentTransactionCreateManyInput[] = [];
  for (let i = 0; i < 24; i++) {
    const month = (i % 6) + 1;
    const day = ((i * 7) % 28) + 1;
    const pmtDate = new Date(2026, month - 1, day);
    realisticPayments.push({
      associationId: association.id,
      userId: getRandomElement(allUsers).id,
      amount: new Prisma.Decimal(250 + Math.floor(Math.random() * 750)),
      currency: 'INR',
      gateway: i % 5 === 0 ? PaymentGateway.MANUAL : PaymentGateway.RAZORPAY,
      status: i % 8 === 0 ? PaymentStatus.PENDING : PaymentStatus.COMPLETED,
      method: [
        PaymentMethod.UPI,
        PaymentMethod.BANK_TRANSFER,
        PaymentMethod.CHEQUE,
        PaymentMethod.CASH,
        PaymentMethod.ONLINE,
      ][i % 5],
      referenceNumber: `TXN-RL-${data.short.toUpperCase()}-${String(i).padStart(4, '0')}`,
      receiptNumber: `REC-RL-${data.short.toUpperCase()}-${String(i).padStart(4, '0')}`,
      razorpayOrderId:
        i % 5 === 0 ? undefined : `order_rl_${data.short}_${String(i).padStart(4, '0')}`,
      razorpayPaymentId:
        i % 5 === 0 ? undefined : `pay_rl_${data.short}_${String(i).padStart(4, '0')}`,
      razorpaySignature: i % 5 === 0 ? undefined : 'sig_verified',
      createdById: financeUser.id,
      verifiedById: i % 8 === 0 ? undefined : superAdminUser.id,
      paymentDate: pmtDate,
      paidAt: i % 8 === 0 ? undefined : pmtDate,
      notes: `Monthly contribution - ${pmtDate.toLocaleDateString('en-IN')}`,
    });
  }
  await prisma.paymentTransaction.createMany({ data: realisticPayments });

  // 78. REALISTIC USERS (with complete profile data)
  console.log('-> Creating realistic user profiles...');
  const realisticUsers: Prisma.UserCreateManyInput[] = [
    {
      associationId: association.id,
      email: `senior.officer@${data.short}.org`,
      name: `Amit Sharma`,
      mobile: '9876543211',
      designation: 'Joint Secretary',
      role: [UserRole.MEMBER],
      password: basePassword,
      status: UserStatus.ACTIVE,
      membershipNumber: `${data.short.toUpperCase()}-R001`,
      imageUrl: 'https://placehold.co/300x300',
      mfaEnabled: true,
      memberTypeId: createdMemberTypes[1]?.id,
      dateOfJoiningGovt: new Date('2010-06-01'),
      dateOfJoiningAssociation: new Date('2015-01-15'),
    },
    {
      associationId: association.id,
      email: `retired.member@${data.short}.org`,
      name: `Priya Verma`,
      mobile: '9876543212',
      designation: 'Former Director',
      role: [UserRole.MEMBER],
      password: basePassword,
      status: UserStatus.INACTIVE,
      membershipNumber: `${data.short.toUpperCase()}-R002`,
      imageUrl: 'https://placehold.co/300x300',
      mfaEnabled: false,
      memberTypeId: createdMemberTypes[2]?.id,
      dateOfJoiningGovt: new Date('1995-03-15'),
      dateOfJoiningAssociation: new Date('2000-07-01'),
      overallConsentStatus: ConsentStatus.WITHDRAWN,
    },
    {
      associationId: association.id,
      email: `new.member@${data.short}.org`,
      name: `Rahul Das`,
      mobile: '9876543213',
      designation: 'Assistant Section Officer',
      role: [UserRole.MEMBER],
      password: basePassword,
      status: UserStatus.PENDING,
      membershipNumber: `${data.short.toUpperCase()}-R003`,
      imageUrl: 'https://placehold.co/300x300',
      mfaEnabled: false,
      memberTypeId: createdMemberTypes[0]?.id,
      dateOfJoiningGovt: new Date('2023-11-01'),
      dateOfJoiningAssociation: new Date('2024-06-15'),
      failedLoginAttempts: 2,
    },
    {
      associationId: association.id,
      email: `suspended.user@${data.short}.org`,
      name: `Vikram Singh`,
      mobile: '9876543214',
      designation: 'Accountant',
      role: [UserRole.FINANCE],
      password: basePassword,
      status: UserStatus.SUSPENDED,
      membershipNumber: `${data.short.toUpperCase()}-R004`,
      imageUrl: 'https://placehold.co/300x300',
      mfaEnabled: false,
      memberTypeId: createdMemberTypes[0]?.id,
      dateOfJoiningGovt: new Date('2018-04-01'),
      dateOfJoiningAssociation: new Date('2019-02-01'),
      failedLoginAttempts: 5,
      lockedUntil: new Date('2027-01-01'),
    },
  ];
  await prisma.user.createMany({ data: realisticUsers });

  // 79. ADDITIONAL MEETING ATTENDEES (accepted RSVPs with timestamps)
  console.log('-> Creating accepted meeting attendees...');
  for (const meeting of additionalMeetings) {
    await prisma.meetingAttendee.createMany({
      data: [
        {
          meetingId: meeting.id,
          userId: superAdminUser.id,
          attendeeRole: AttendeeRole.HOST,
          rsvpStatus: RsvpStatus.ACCEPTED,
          rsvpNote: 'Will attend',
          rsvpAt: new Date(Date.now() - 86400000),
          notifiedAt: new Date(Date.now() - 172800000),
        },
        {
          meetingId: meeting.id,
          userId: dpoUser.id,
          attendeeRole: AttendeeRole.REQUIRED,
          rsvpStatus: RsvpStatus.ACCEPTED,
          rsvpAt: new Date(Date.now() - 43200000),
          notifiedAt: new Date(Date.now() - 172800000),
        },
        {
          meetingId: meeting.id,
          userId: financeUser.id,
          attendeeRole: AttendeeRole.OPTIONAL,
          rsvpStatus: RsvpStatus.DECLINED,
          rsvpNote: 'Out of station',
          rsvpAt: new Date(Date.now() - 72000000),
          notifiedAt: new Date(Date.now() - 172800000),
        },
      ],
    });
  }

  // 80. NOTIFICATIONS WITH READ STATUS
  console.log('-> Creating read notifications...');
  await prisma.notification.createMany({
    data: [
      {
        associationId: association.id,
        userId: memberUser.id,
        title: 'Payment Confirmed',
        body: 'Your May contribution was received',
        type: NotificationType.SYSTEM,
        route: '/payments',
        entityId: payment.id,
        isRead: true,
        readAt: new Date(Date.now() - 3600000),
        isReceived: true,
        receivedAt: new Date(Date.now() - 7200000),
      },
      {
        associationId: association.id,
        userId: secretaryUser.id,
        title: 'Meeting Reminder',
        body: 'EC Meeting tomorrow at 10 AM',
        type: NotificationType.GENERAL_MESSAGE,
        route: '/meetings',
        entityId: noticeMeeting.id,
        isRead: true,
        readAt: new Date(Date.now() - 1800000),
        isReceived: true,
        receivedAt: new Date(Date.now() - 86400000),
      },
      {
        associationId: association.id,
        userId: financeUser.id,
        title: 'New follower',
        body: 'DPO started following you',
        type: NotificationType.FOLLOW,
        route: '/profile',
        entityId: dpoUser.id,
        isRead: false,
        isReceived: true,
        receivedAt: new Date(Date.now() - 600000),
      },
    ],
  });

  // 81. REALISTIC AUDIT LOGS (common user actions)
  console.log('-> Creating realistic audit logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        associationId: association.id,
        actorId: memberUser.id,
        action: AuditAction.LOGIN,
        resourceType: 'Session',
        ipAddress: '203.0.113.42',
        userAgent: 'Mozilla/5.0 (Android 14)',
        traceId: `login-${memberUser.id}-1`,
      },
      {
        associationId: association.id,
        actorId: memberUser.id,
        action: AuditAction.LOGOUT,
        resourceType: 'Session',
        ipAddress: '203.0.113.42',
        traceId: `logout-${memberUser.id}-1`,
      },
      {
        associationId: association.id,
        actorId: memberUser.id,
        action: AuditAction.CONSENT_GRANT,
        resourceType: 'ConsentReceipt',
        newValues: { purpose: 'COMMUNICATIONS', status: 'GRANTED' },
        ipAddress: '203.0.113.42',
      },
      {
        associationId: association.id,
        actorId: memberUser.id,
        action: AuditAction.DSAR_SUBMIT,
        resourceType: 'DsarTicket',
        resourceId: 'CORR-001',
        ipAddress: '203.0.113.42',
      },
      {
        associationId: association.id,
        actorId: dpoUser.id,
        action: AuditAction.DSAR_RESPOND,
        resourceType: 'DsarTicket',
        resourceId: 'DSAR-CORR-001',
        ipAddress: '10.0.0.5',
      },
      {
        associationId: association.id,
        actorId: memberUser.id,
        action: AuditAction.PAYMENT_CREATED,
        resourceType: 'PaymentTransaction',
        resourceId: 'TXN-RL-001',
        ipAddress: '203.0.113.42',
      },
      {
        associationId: association.id,
        actorId: superAdminUser.id,
        action: AuditAction.PAYMENT_VERIFIED,
        resourceType: 'PaymentTransaction',
        resourceId: 'TXN-RL-001',
        ipAddress: '10.0.0.1',
      },
      {
        associationId: association.id,
        actorId: memberUser.id,
        action: AuditAction.PAYMENT_FAILED,
        resourceType: 'PaymentTransaction',
        resourceId: 'failed-ref',
        newValues: { error: 'insufficient_balance' },
        ipAddress: '203.0.113.42',
      },
      {
        associationId: association.id,
        actorId: superAdminUser.id,
        action: AuditAction.ANNOUNCEMENT_CREATE,
        resourceType: 'Announcement',
        resourceId: 'DRAFT-BUDGET',
        newValues: { title: 'Draft Budget Proposal', status: 'DRAFT' },
      },
      {
        associationId: association.id,
        actorId: superAdminUser.id,
        action: AuditAction.ANNOUNCEMENT_PUBLISH,
        resourceType: 'Announcement',
        resourceId: 'PUB-001',
        newValues: { publishedAt: new Date().toISOString() },
      },
      {
        associationId: association.id,
        actorId: memberUser.id,
        action: AuditAction.ANNOUNCEMENT_READ,
        resourceType: 'Announcement',
        resourceId: 'PUB-001',
        ipAddress: '203.0.113.42',
      },
      {
        associationId: association.id,
        actorId: secretaryUser.id,
        action: AuditAction.TRAINING_COMPLETE,
        resourceType: 'TrainingCompletion',
        newValues: { moduleName: 'Data Privacy', score: 95 },
        ipAddress: '10.0.0.2',
      },
      {
        associationId: association.id,
        actorId: memberUser.id,
        action: AuditAction.COMPLAINT_CREATE,
        resourceType: 'Complaint',
        resourceId: 'login-issue',
        ipAddress: '203.0.113.42',
      },
      {
        associationId: association.id,
        actorId: secretaryUser.id,
        action: AuditAction.COMPLAINT_UPDATE,
        resourceType: 'Complaint',
        resourceId: 'login-issue',
        newValues: { status: 'IN_PROGRESS', assignedTo: 'Secretary' },
      },
      {
        associationId: association.id,
        actorId: superAdminUser.id,
        action: AuditAction.DELETE,
        resourceType: 'User',
        resourceId: 'suspended-user',
        oldValues: { role: 'FINANCE' },
        ipAddress: '10.0.0.1',
      },
      {
        associationId: association.id,
        actorId: financeUser.id,
        action: AuditAction.WEBHOOK_RECEIVED,
        resourceType: 'PaymentWebhookEvent',
        newValues: { eventType: 'payment.captured', gateway: 'RAZORPAY' },
      },
    ],
  });

  // ---------------------------------------------------------------------------
  // BULK STATUS COVERAGE (hundreds of records per status value)
  // ---------------------------------------------------------------------------

  const BULK_COUNT = 500;

  // 82. BULK USERS
  console.log(`-> Creating bulk users (${BULK_COUNT} per status)...`);
  const bulkUsersData: Prisma.UserCreateManyInput[] = [];
  for (const status of [
    UserStatus.INACTIVE,
    UserStatus.SUSPENDED,
    UserStatus.ANONYMIZED,
    UserStatus.PENDING,
  ]) {
    for (let i = 1; i <= BULK_COUNT; i++) {
      const idx = bulkUsersData.length + 1;
      bulkUsersData.push({
        associationId: association.id,
        email: `bulk.${status.toLowerCase()}.${idx}@${data.short}.org`,
        name: `${data.short.toUpperCase()} Bulk ${status} #${idx}`,
        mobile: String(9000000000 + (idx % 99999999)),
        designation: 'Member',
        role: [UserRole.MEMBER],
        password: basePassword,
        status,
        membershipNumber: `${data.short.toUpperCase()}-BLK-${status}-${String(idx).padStart(6, '0')}`,
        imageUrl: 'https://placehold.co/300x300',
        mfaEnabled: idx % 20 === 0,
        memberTypeId: createdMemberTypes[idx % createdMemberTypes.length]?.id,
      });
    }
  }
  await prisma.user.createMany({ data: bulkUsersData });

  const allBulkUsers = await prisma.user.findMany({
    where: { associationId: association.id },
    select: { id: true, role: true, name: true },
  });

  // 83. BULK MEETINGS
  console.log(`-> Creating bulk meetings (${BULK_COUNT} per status)...`);
  const bulkMeetingsData: Prisma.MeetingCreateManyInput[] = [];
  for (const mStatus of [MeetingStatus.NOTICE_ISSUED, MeetingStatus.CANCELLED]) {
    for (let i = 1; i <= BULK_COUNT; i++) {
      bulkMeetingsData.push({
        associationId: association.id,
        title: `Bulk ${mStatus} #${i}`,
        type: i % 2 === 0 ? MeetingType.GENERAL_MEETING : MeetingType.EC_MEETING,
        status: mStatus,
        scheduledAt: new Date(2026, i % 12, (i % 28) + 1),
        venue: i % 3 === 0 ? 'Shillong Convention Hall' : 'Virtual Bridge',
        createdById: superAdminUser.id,
        noticeIssuedAt: mStatus === MeetingStatus.NOTICE_ISSUED ? new Date() : undefined,
      });
    }
  }
  await prisma.meeting.createMany({ data: bulkMeetingsData });

  const allBulkMeetings = await prisma.meeting.findMany({
    where: { associationId: association.id },
    select: { id: true },
  });

  // 84. BULK MEETING ATTENDEES
  console.log('-> Creating bulk meeting attendees...');
  const bulkAttendeeData: Prisma.MeetingAttendeeCreateManyInput[] = [];
  const usedAttendeeKeys = new Set<string>();
  for (let i = 0; i < 3000; i++) {
    const meeting = allBulkMeetings[i % allBulkMeetings.length];
    const user = allBulkUsers[i % allBulkUsers.length];
    const key = `${meeting.id}-${user.id}`;
    if (usedAttendeeKeys.has(key)) continue;
    usedAttendeeKeys.add(key);
    bulkAttendeeData.push({
      meetingId: meeting.id,
      userId: user.id,
      attendeeRole:
        i % 5 === 0
          ? AttendeeRole.HOST
          : i % 5 === 1
            ? AttendeeRole.CO_HOST
            : i % 5 === 2
              ? AttendeeRole.OPTIONAL
              : i % 5 === 3
                ? AttendeeRole.OBSERVER
                : AttendeeRole.REQUIRED,
      rsvpStatus:
        i % 4 === 0 ? RsvpStatus.ACCEPTED : i % 4 === 1 ? RsvpStatus.DECLINED : RsvpStatus.PENDING,
      rsvpAt: i % 4 !== 2 ? new Date() : undefined,
      notifiedAt: new Date(),
    });
  }
  await prisma.meetingAttendee.createMany({
    data: bulkAttendeeData,
    skipDuplicates: true,
  });

  // 85. BULK CONSENT RECEIPTS
  console.log(`-> Creating bulk consent receipts (${BULK_COUNT} per purpose)...`);
  const bulkConsentData: Prisma.ConsentReceiptCreateManyInput[] = [];
  for (const purpose of [
    ConsentPurpose.COMMUNICATIONS,
    ConsentPurpose.MEETINGS,
    ConsentPurpose.ANALYTICS,
    ConsentPurpose.MARKETING,
  ]) {
    for (let i = 0; i < BULK_COUNT; i++) {
      bulkConsentData.push({
        associationId: association.id,
        userId: getRandomElement(allBulkUsers).id,
        purpose,
        status: i % 4 === 0 ? ConsentStatus.WITHDRAWN : ConsentStatus.GRANTED,
        channel: i % 2 === 0 ? 'web' : 'mobile',
      });
    }
  }
  await prisma.consentReceipt.createMany({ data: bulkConsentData });

  // 86. BULK DSAR TICKETS
  console.log(`-> Creating bulk DSAR tickets (${BULK_COUNT} per type)...`);
  let dsarCounter = 1;
  const bulkDsarData: Prisma.DsarTicketCreateManyInput[] = [];
  for (const reqType of [DsarRequestType.CORRECTION, DsarRequestType.PORTABILITY]) {
    for (let i = 0; i < BULK_COUNT; i++) {
      bulkDsarData.push({
        associationId: association.id,
        userId: getRandomElement(allBulkUsers).id,
        assignedToId: dpoUser.id,
        ticketNumber: `${data.short.toUpperCase()}-BDSAR-${String(dsarCounter++).padStart(7, '0')}`,
        requestType: reqType,
        requestedData: ['Profile', 'Payments'],
        description: `Bulk DSAR ${reqType}`,
        status:
          i % 3 === 0
            ? DsarStatus.PENDING
            : i % 3 === 1
              ? DsarStatus.IN_PROGRESS
              : DsarStatus.COMPLETED,
      });
    }
  }
  await prisma.dsarTicket.createMany({ data: bulkDsarData });

  // 87. BULK PAYMENT TRANSACTIONS
  console.log(`-> Creating bulk payments (${BULK_COUNT} per status)...`);
  let pmtIdx = 0;
  const bulkPaymentData: Prisma.PaymentTransactionCreateManyInput[] = [];
  for (const pStatus of [
    PaymentStatus.PENDING,
    PaymentStatus.FAILED,
    PaymentStatus.REFUNDED,
    PaymentStatus.WAIVED,
  ]) {
    for (let i = 1; i <= BULK_COUNT; i++) {
      pmtIdx++;
      bulkPaymentData.push({
        associationId: association.id,
        userId: getRandomElement(allBulkUsers).id,
        amount: new Prisma.Decimal(250 + ((pmtIdx * 7) % 750)),
        currency: 'INR',
        gateway: pmtIdx % 4 === 0 ? PaymentGateway.MANUAL : PaymentGateway.RAZORPAY,
        status: pStatus,
        method: [
          PaymentMethod.UPI,
          PaymentMethod.BANK_TRANSFER,
          PaymentMethod.CHEQUE,
          PaymentMethod.CASH,
          PaymentMethod.ONLINE,
        ][pmtIdx % 5],
        referenceNumber: `BTXN-${data.short.toUpperCase()}-${pStatus}-${String(pmtIdx).padStart(6, '0')}`,
        razorpayOrderId:
          pmtIdx % 4 === 0
            ? undefined
            : `bord_${data.short}_${pStatus}_${String(pmtIdx).padStart(6, '0')}`,
        razorpayPaymentId:
          pmtIdx % 4 === 0
            ? undefined
            : `bpay_${data.short}_${pStatus}_${String(pmtIdx).padStart(6, '0')}`,
        razorpaySignature: pmtIdx % 4 === 0 ? undefined : 'bulk_sig',
        paidAt: pStatus === PaymentStatus.REFUNDED ? new Date() : undefined,
        failedAt: pStatus === PaymentStatus.FAILED ? new Date() : undefined,
        paymentDate: new Date(2026, pmtIdx % 12, ((pmtIdx * 3) % 28) + 1),
        createdById: financeUser.id,
        verifiedById: pStatus === PaymentStatus.REFUNDED ? superAdminUser.id : undefined,
        notes: `Bulk payment ${pStatus} - #${pmtIdx}`,
      });
    }
  }
  await prisma.paymentTransaction.createMany({ data: bulkPaymentData });

  // 88. BULK CONTRIBUTION PERIODS
  console.log(`-> Creating bulk contribution periods (${BULK_COUNT} per status)...`);
  const bulkContribData: Prisma.ContributionPeriodCreateManyInput[] = [];
  const usedContribKeys = new Set<string>();
  let cIdx = 0;
  for (const cStatus of [
    ContributionStatus.DUE,
    ContributionStatus.PARTIAL,
    ContributionStatus.OVERDUE,
    ContributionStatus.WAIVED,
  ]) {
    for (let i = 0; i < BULK_COUNT; i++) {
      const user = allBulkUsers[cIdx % allBulkUsers.length];
      const year = 2023 + (cIdx % 3);
      const month = (cIdx % 12) + 1;
      const key = `${user.id}-${year}-${month}`;
      if (usedContribKeys.has(key)) {
        cIdx++;
        i--;
        continue;
      }
      usedContribKeys.add(key);
      const expected = new Prisma.Decimal(500);
      const paid =
        cStatus === ContributionStatus.PARTIAL ? new Prisma.Decimal(250) : new Prisma.Decimal(0);
      bulkContribData.push({
        associationId: association.id,
        userId: user.id,
        year,
        month,
        expectedAmount: expected,
        paidAmount: paid,
        dueAmount: expected.sub(paid),
        status: cStatus,
        dueDate: new Date(year, month, 15),
        waivedAt: cStatus === ContributionStatus.WAIVED ? new Date() : undefined,
        waivedReason: cStatus === ContributionStatus.WAIVED ? 'Bulk waiver' : undefined,
      });
      cIdx++;
    }
  }
  await prisma.contributionPeriod.createMany({
    data: bulkContribData,
    skipDuplicates: true,
  });

  // 89. BULK COMPLAINTS
  console.log(`-> Creating bulk complaints (${BULK_COUNT} per status)...`);
  let compIdx = 0;
  const bulkComplaintData: Prisma.ComplaintCreateManyInput[] = [];
  for (const cStatus of [ComplaintStatus.IN_PROGRESS, ComplaintStatus.CLOSED]) {
    for (let i = 1; i <= BULK_COUNT; i++) {
      compIdx++;
      bulkComplaintData.push({
        associationId: association.id,
        userId: getRandomElement(allBulkUsers).id,
        category: ComplaintCategory.OTHER,
        subject: `Bulk complaint #${compIdx}`,
        description: `Automated complaint - ${cStatus}`,
        status: cStatus,
        priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][compIdx % 4],
        assignedToId: secretaryUser.id,
        resolvedAt: cStatus === ComplaintStatus.CLOSED ? new Date() : undefined,
      });
    }
  }
  await prisma.complaint.createMany({ data: bulkComplaintData });

  // 90. BULK COMPLIANCE CHECKS
  console.log(`-> Creating bulk compliance checks (${BULK_COUNT} per status)...`);
  const bulkComplianceData: Prisma.ComplianceCheckCreateManyInput[] = [];
  for (const ccStatus of [
    ComplianceCheckStatus.FAILED,
    ComplianceCheckStatus.WARNING,
    ComplianceCheckStatus.SKIPPED,
  ]) {
    for (let i = 1; i <= BULK_COUNT; i++) {
      bulkComplianceData.push({
        associationId: association.id,
        checkType: `BULK_CHECK_${ccStatus}_${i}`,
        status: ccStatus,
        score:
          ccStatus === ComplianceCheckStatus.FAILED
            ? 30 + (i % 30)
            : ccStatus === ComplianceCheckStatus.WARNING
              ? 65 + (i % 20)
              : 0,
        message: `Bulk check ${i}: ${ccStatus}`,
        details: { batchId: i, automated: true },
        recommendations: {
          reviewRequired: ccStatus !== ComplianceCheckStatus.SKIPPED,
        },
      });
    }
  }
  await prisma.complianceCheck.createMany({ data: bulkComplianceData });

  // 91. BULK TRAINING ASSIGNMENTS
  console.log(`-> Creating bulk training assignments (${BULK_COUNT} per status)...`);
  const bulkTrainingData: Prisma.TrainingAssignmentCreateManyInput[] = [];
  const usedTrainingKeys = new Set<string>();
  let tIdx = 0;
  for (const tStatus of [
    TrainingAssignmentStatus.COMPLETED,
    TrainingAssignmentStatus.OVERDUE,
    TrainingAssignmentStatus.EXEMPT,
  ]) {
    for (let i = 0; i < BULK_COUNT; i++) {
      const tModule = allTrainingModules[tIdx % allTrainingModules.length];
      const user = allBulkUsers[tIdx % allBulkUsers.length];
      const key = `${tModule.id}-${user.id}`;
      if (usedTrainingKeys.has(key)) {
        tIdx++;
        i--;
        continue;
      }
      usedTrainingKeys.add(key);
      bulkTrainingData.push({
        moduleId: tModule.id,
        userId: user.id,
        status: tStatus,
        assignedAt: new Date(2026, 0, 1),
        dueDate: new Date(2026, 5, 30),
        startedAt: new Date(2026, 1, 1),
        completedAt:
          tStatus === TrainingAssignmentStatus.COMPLETED ? new Date(2026, 3, 15) : undefined,
        assignedById: superAdminUser.id,
        notes: tStatus === TrainingAssignmentStatus.EXEMPT ? 'Bulk exempt' : undefined,
      });
      tIdx++;
    }
  }
  await prisma.trainingAssignment.createMany({
    data: bulkTrainingData,
    skipDuplicates: true,
  });

  // 92. BULK NOTIFICATIONS
  console.log(`-> Creating bulk notifications (${BULK_COUNT} per type)...`);
  let nIdx = 0;
  const bulkNotificationData: Prisma.NotificationCreateManyInput[] = [];
  for (const nType of [NotificationType.GENERAL_MESSAGE, NotificationType.FOLLOW]) {
    for (let i = 1; i <= BULK_COUNT; i++) {
      nIdx++;
      bulkNotificationData.push({
        associationId: association.id,
        userId: getRandomElement(allBulkUsers).id,
        title: `Bulk ${nType} #${nIdx}`,
        body: `Notification ${nIdx} - ${nType}`,
        type: nType,
        route: nIdx % 2 === 0 ? '/dashboard' : '/profile',
        entityId: getRandomElement(allBulkUsers).id,
        isRead: nIdx % 3 === 0,
        readAt: nIdx % 3 === 0 ? new Date() : undefined,
        isReceived: true,
        receivedAt: new Date(),
      });
    }
  }
  await prisma.notification.createMany({ data: bulkNotificationData });

  // 93. BULK ANNOUNCEMENTS
  console.log(`-> Creating bulk announcements (${BULK_COUNT} per status)...`);
  let aIdx = 0;
  const bulkAnnouncementData: Prisma.AnnouncementCreateManyInput[] = [];
  for (const aStatus of [
    AnnouncementStatus.DRAFT,
    AnnouncementStatus.SCHEDULED,
    AnnouncementStatus.ARCHIVED,
  ]) {
    for (let i = 1; i <= BULK_COUNT; i++) {
      aIdx++;
      bulkAnnouncementData.push({
        associationId: association.id,
        authorId: superAdminUser.id,
        title: `Bulk ${aStatus} #${aIdx}`,
        summary: `Summary ${aIdx}`,
        content: `Full content for announcement ${aIdx}`,
        status: aStatus,
        priority: [
          AnnouncementPriority.LOW,
          AnnouncementPriority.NORMAL,
          AnnouncementPriority.HIGH,
          AnnouncementPriority.URGENT,
        ][aIdx % 4],
        targetRoles: [UserRole.MEMBER],
        publishedAt:
          aStatus === AnnouncementStatus.DRAFT
            ? null
            : aStatus === AnnouncementStatus.SCHEDULED
              ? new Date('2027-01-01')
              : new Date('2025-01-01'),
        isPinned: aIdx % 50 === 0,
      });
    }
  }
  await prisma.announcement.createMany({ data: bulkAnnouncementData });

  // 94. BULK AUDIT LOGS
  console.log('-> Creating bulk audit logs...');
  let auditIdx = 0;
  const bulkAuditData: Prisma.AuditLogCreateManyInput[] = [];
  for (const action of [
    AuditAction.LOGIN,
    AuditAction.LOGOUT,
    AuditAction.PAYMENT_CREATED,
    AuditAction.PAYMENT_FAILED,
    AuditAction.ANNOUNCEMENT_READ,
    AuditAction.TRAINING_COMPLETE,
    AuditAction.COMPLAINT_CREATE,
  ]) {
    for (let i = 1; i <= BULK_COUNT; i++) {
      auditIdx++;
      bulkAuditData.push({
        associationId: association.id,
        actorId: getRandomElement(allBulkUsers).id,
        action,
        resourceType: String(action),
        resourceId: `bulk-${auditIdx}`,
        ipAddress: `10.0.${(auditIdx * 3) % 255}.${auditIdx % 255}`,
        userAgent: 'Bulk Seed Agent',
        traceId: `bulk-${action}-${auditIdx}`,
      });
    }
  }
  await prisma.auditLog.createMany({ data: bulkAuditData });

  console.log(`\n✓ ${data.name} seeded successfully`);
  console.log(`\n   Login credentials for ${data.short.toUpperCase()}:`);
  console.log(`   Password: ${process.env.PASSWORD || 'securepassword123'}`);
  for (const role of roles) {
    console.log(`   ${role}: ${roleUsers[role].email}`);
  }
}

// -----------------------------------------------------------------------------
// CORE ENTRY EXECUTION
// -----------------------------------------------------------------------------
async function main() {
  console.log('\n--- Initializing Comprehensive Global Database Purge ---');

  await prisma.announcementRead.deleteMany();
  await prisma.meetingMinutes.deleteMany();
  await prisma.agendaItem.deleteMany();
  await prisma.meetingAttendee.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.trainingCertificate.deleteMany();
  await prisma.trainingCompletion.deleteMany();
  await prisma.trainingSupplement.deleteMany();
  await prisma.trainingAssignment.deleteMany();
  await prisma.trainingModule.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.consentReceipt.deleteMany();
  await prisma.dsarResponse.deleteMany();
  await prisma.dsarTicket.deleteMany();
  await prisma.paymentWebhookEvent.deleteMany();
  await prisma.paymentAllocation.deleteMany();
  await prisma.contributionPeriod.deleteMany();
  await prisma.ledgerLine.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.complianceCheck.deleteMany();
  await prisma.paymentProvider.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionBillingHistory.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.memberType.deleteMany();
  await prisma.pushToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.verificationCode.deleteMany();
  await prisma.file.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.association.deleteMany();
  await prisma.membershipApplication.deleteMany();
  await prisma.log.deleteMany();

  console.log('✓ Purge complete. Execution space prepared.');

  for (const association of ASSOCIATIONS) {
    await seedAssociation(association);
  }

  console.log('\n🚩 Global High-Scale Performance Database Seed Pipeline Completed Successfully.');
}

main()
  .catch((error) => {
    console.error('Critical Failure in execution pipeline chain:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
