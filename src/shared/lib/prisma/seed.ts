import * as crypto from "crypto";
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
  ComplaintStatus,
  ComplianceCheckStatus,
  TrainingAssignmentStatus,
} from "@prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

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
    slug: "mfsa",
    short: "mfsa",
    name: "Meghalaya Finance Service Association",
    primaryColor: "#1e3a8a",
    secondaryColor: "#3b82f6",
  },
  {
    slug: "mpsa",
    short: "mpsa",
    name: "Meghalaya Planning Service Association",
    primaryColor: "#065f46",
    secondaryColor: "#10b981",
  },
];

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

function buildUserEmail(role: UserRole, association: string) {
  return `${role.toLowerCase()}@${association}.org`;
}

function buildUserName(role: UserRole, association: string) {
  return `${association.toUpperCase()} ${role.replaceAll("_", " ")}`;
}

export const encrypt = (plain: string): string => {
  const iv = crypto.randomBytes(16);
  const KEY = Buffer.from(
    process.env.FIELD_ENCRYPTION_KEY ||
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "hex",
  );
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};

// Helper to reliably sample random records from arrays
const getRandomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

// -----------------------------------------------------------------------------
// SCALE SEEDING FUNCTION
// -----------------------------------------------------------------------------
async function seedAssociation(data: (typeof ASSOCIATIONS)[number]) {
  console.log(`\n--- Seeding ${data.name} ---`);

  const basePassword = await hashPassword(
    process.env.PASSWORD || "securepassword123",
  );
  const encKeyId = encrypt(process.env.RAZORPAY_KEY_ID || "rzp_test_12345");
  const encSecret = encrypt(process.env.RAZORPAY_KEY_SECRET || "secret_12345");
  const encWebhook = encrypt(
    process.env.RAZORPAY_WEBHOOK_SECRET || "whsec_12345",
  );

  // 1. Association
  const association = await prisma.association.create({
    data: {
      slug: data.slug,
      name: data.name,
      description: `${data.name} official association portal`,
      state: "Meghalaya",
      country: "IN",
      timezone: "Asia/Kolkata",
      currencyCode: "INR",
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      contactEmail: `contact@${data.short}.org`,
      contactPhone: "9876543210",
    },
  });

  // 2. Member Types
  const mTypesConfig = [
    "Regular Member",
    "Executive Member",
    "Honorary Member",
    "Associate Member",
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
        amount: new Prisma.Decimal(500 * i),
        currency: "INR",
        billingCycle: i % 2 === 0 ? "YEARLY" : "MONTHLY",
        features: { voting: i > 1, newsletter: true, premiumEvents: i > 3 },
      },
    });
    subscriptionPlans.push(sp);
  }

  // 4. ROLE-BASED USERS (for easy login testing)
  console.log("-> Creating role-based users for login testing...");
  const roles = [
    UserRole.SUPER_ADMIN,
    UserRole.PRESIDENT,
    UserRole.SECRETARY,
    UserRole.FINANCE,
    UserRole.DPO,
    UserRole.MEMBER,
  ];

  const roleUsers: Record<UserRole, any> = {} as any;

  for (const role of roles) {
    const user = await prisma.user.create({
      data: {
        associationId: association.id,
        email: buildUserEmail(role, data.short),
        name: buildUserName(role, data.short),
        mobile: "9999999999",
        designation: `${role} Designation`,
        role: [role],
        password: basePassword,
        status: UserStatus.ACTIVE,
        membershipNumber: `${data.short.toUpperCase()}-${role}`,
        imageUrl: "https://placehold.co/300x300",
        mfaEnabled: false,
        memberTypeId: createdMemberTypes[0]?.id,
        subscription:
          role === UserRole.MEMBER
            ? {
                create: {
                  planId: subscriptionPlans[0].id,
                  status: "ACTIVE",
                  endDate: new Date("2027-01-01"),
                },
              }
            : undefined,
      },
    });
    roleUsers[role] = user;
    console.log(`   ✓ ${role}: ${user.email}`);
  }

  // 5. BULK USERS (1,000 records for load testing)
  console.log("-> Generating 1,000 bulk user accounts...");
  const usersToInsert: Prisma.UserCreateManyInput[] = [];
  for (let i = 1; i <= 1000; i++) {
    usersToInsert.push({
      associationId: association.id,
      email: `member.${i}@${data.short}portal.org`,
      name: `${data.short.toUpperCase()} Member ${i}`,
      mobile: `9${String(i).padStart(9, "0")}`,
      designation: "Member Designation",
      role: [UserRole.MEMBER],
      password: basePassword,
      status: UserStatus.ACTIVE,
      membershipNumber: `${data.short.toUpperCase()}-BULK-${String(i).padStart(5, "0")}`,
      imageUrl: "https://placehold.co/300x300",
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
  console.log("-> Generating bulk push tokens...");
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
        expiresAt: new Date("2027-01-01"),
      },
    });
  }

  // 9. Bulk Refresh Tokens
  console.log("-> Generating bulk refresh tokens...");
  await prisma.refreshToken.createMany({
    data: allUsers.map((u, i) => ({
      userId: u.id,
      token: `tok-refresh-bulk-${i}-${u.id}`,
      expiresAt: new Date("2028-01-01"),
    })),
  });

  // 10. Verification Codes
  await prisma.verificationCode.create({
    data: {
      userId: memberUser.id,
      code: "123456",
      type: "EMAIL_VERIFICATION",
      expiresAt: new Date(Date.now() + 1000 * 60 * 10),
    },
  });

  // 11. Bulk Verification Codes
  console.log("-> Generating bulk verification codes...");
  await prisma.verificationCode.createMany({
    data: allUsers.slice(0, 500).map((u) => ({
      userId: u.id,
      code: String(100000 + Math.floor(Math.random() * 899999)),
      type: "EMAIL_VERIFICATION",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    })),
  });

  // 12. Meeting (for role users)
  console.log("-> Creating meetings...");
  const meeting = await prisma.meeting.create({
    data: {
      associationId: association.id,
      title: `${data.short.toUpperCase()} Annual General Meeting`,
      type: MeetingType.GENERAL_MEETING,
      status: MeetingStatus.SCHEDULED,
      scheduledAt: new Date("2026-06-15T10:00:00Z"),
      venue: "Shillong Convention Hall",
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
      venue:
        i % 2 === 0
          ? "Shillong Secretariat Auditorium"
          : "Virtual Video Bridge Hub",
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
    data: roles.map((role) => ({
      meetingId: meeting.id,
      userId: roleUsers[role].id,
      attendeeRole: AttendeeRole.REQUIRED,
      rsvpStatus:
        role === UserRole.SUPER_ADMIN
          ? RsvpStatus.ACCEPTED
          : RsvpStatus.PENDING,
      rsvpNote:
        role === UserRole.SUPER_ADMIN ? "Confirmed attendance" : undefined,
      rsvpAt: role === UserRole.SUPER_ADMIN ? new Date() : undefined,
      notifiedAt: new Date(),
    })),
  });

  // 15. Bulk Meeting Attendees
  console.log("-> Generating bulk meeting attendees...");
  const bulkUsers = allUsers.filter(
    (u) => !roles.some((r) => roleUsers[r]?.id === u.id),
  );
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
        title: "Opening Remarks",
        description: "President speech",
      },
      {
        meetingId: meeting.id,
        order: 2,
        title: "Financial Report",
        description: "Annual financial report",
      },
    ],
  });

  // 17. Bulk Agenda Items
  console.log("-> Generating bulk agenda items...");
  await prisma.agendaItem.createMany({
    data: Array.from({ length: 1000 }).map((_, i) => ({
      meetingId: getRandomElement(allMeetings).id,
      order: (i % 3) + 1,
      title: `Strategic Roadmap Blueprint Focus Segment Section-${i}`,
      description:
        "Review of organizational parameters, structural updates, and operations metrics framework parameters.",
    })),
  });

  // 18. Meeting Minutes
  await prisma.meetingMinutes.create({
    data: {
      meetingId: meeting.id,
      agendaPoint: "Financial Report",
      decision: "Budget approved unanimously",
      actionItems: [
        {
          assignee: financeUser.name,
          task: "Prepare next quarter report",
        },
      ],
    },
  });

  // 19. Bulk Meeting Minutes
  console.log("-> Generating bulk meeting minutes...");
  await prisma.meetingMinutes.createMany({
    data: allMeetings.map((m, i) => ({
      meetingId: m.id,
      agendaPoint: "Operations Status Tracking Performance Review",
      decision:
        "Operational modifications metrics framework authorization ratified across sectors safely.",
      actionItems: [
        {
          assignee: financeUser.name,
          task: `Execute optimization protocols phase code-${i}`,
        },
      ],
    })),
  });

  // 20. Training Module
  console.log("-> Creating training modules...");
  const trainingModule = await prisma.trainingModule.create({
    data: {
      associationId: association.id,
      title: "Data Privacy Training",
      description: "Mandatory compliance training",
      content: "Training content goes here",
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
        "Mandatory compliance evaluation program covering localized security data architectures.",
      content:
        "Complete framework curriculum instructions text content tracking data details block.",
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
        dueDate: new Date("2026-12-31"),
        assignedById: superAdminUser.id,
      },
      {
        moduleId: trainingModule.id,
        userId: secretaryUser.id,
        status: TrainingAssignmentStatus.IN_PROGRESS,
        assignedAt: new Date(),
        dueDate: new Date("2026-12-31"),
        startedAt: new Date(),
        assignedById: superAdminUser.id,
      },
    ],
  });

  // 23. Bulk Training Assignments
  console.log("-> Generating bulk training assignments...");
  const trainingAssignmentData = [];
  for (let i = 0; i < 1000; i++) {
    const module = allTrainingModules[i % allTrainingModules.length];
    const user = bulkUsers[i % bulkUsers.length];
    trainingAssignmentData.push({
      moduleId: module.id,
      userId: user.id,
      status:
        i % 2 === 0
          ? TrainingAssignmentStatus.IN_PROGRESS
          : TrainingAssignmentStatus.ASSIGNED,
      assignedAt: new Date(),
      dueDate: new Date("2026-12-31"),
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
      certificateUrl: "https://example.com/certificate.pdf",
    },
  });

  // 25. Bulk Training Completions
  console.log("-> Generating bulk training completions...");
  const trainingCompletionData = [];
  for (let i = 0; i < 1000; i++) {
    const moduleIdx = Math.floor(i / 10) % allTrainingModules.length;
    const userIdx = i % bulkUsers.length;
    const module = allTrainingModules[moduleIdx];
    const user = bulkUsers[userIdx];
    trainingCompletionData.push({
      moduleId: module.id,
      userId: user.id,
      scorePercent: new Prisma.Decimal(75 + (i % 25)),
      certificateUrl: `https://secure-cdn.association-hub.org/certs/pdf-generation-asset-${i}.pdf`,
    });
  }
  await prisma.trainingCompletion.createMany({ data: trainingCompletionData });

  // 26. Announcement
  console.log("-> Creating announcements...");
  const announcement = await prisma.announcement.create({
    data: {
      associationId: association.id,
      authorId: roleUsers[UserRole.PRESIDENT].id,
      title: "Annual Conference 2026",
      summary: "Conference scheduled next month",
      content: "Detailed conference information here",
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
        getRandomElement(
          allUsers.filter((u) => !u.role.includes(UserRole.MEMBER)),
        )?.id || superAdminUser.id,
      title: `Strategic Directive Operations Circular Update-${i}`,
      summary:
        "Review of local processing modifications adjustments guidelines updates.",
      content:
        "Complete detailed parameters documentation block concerning policy modification deployments across regional networks.",
      status: AnnouncementStatus.PUBLISHED,
      priority:
        i % 4 === 0 ? AnnouncementPriority.HIGH : AnnouncementPriority.NORMAL,
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
  console.log("-> Generating bulk announcement reads...");
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
  console.log("-> Creating consent receipts...");
  await prisma.consentReceipt.create({
    data: {
      associationId: association.id,
      userId: memberUser.id,
      purpose: ConsentPurpose.PAYMENTS,
      status: ConsentStatus.GRANTED,
      ipAddress: "127.0.0.1",
      userAgent: "seed-script",
      channel: "web",
    },
  });

  // 31. Bulk Consent Receipts
  console.log("-> Generating bulk consent receipts...");
  await prisma.consentReceipt.createMany({
    data: Array.from({ length: 1000 }).map((_, i) => ({
      associationId: association.id,
      userId: getRandomElement(allUsers).id,
      purpose: i % 2 === 0 ? ConsentPurpose.PAYMENTS : ConsentPurpose.MARKETING,
      status: ConsentStatus.GRANTED,
      ipAddress: `192.168.1.${i % 254}`,
      userAgent:
        "Mozilla/5.0 (Client Telemetry Device Engine System Connection)",
      channel: "native-mobile",
    })),
  });

  // 32. DSAR Ticket (role user)
  console.log("-> Creating DSAR tickets...");
  const dsarTicket = await prisma.dsarTicket.create({
    data: {
      associationId: association.id,
      userId: memberUser.id,
      assignedToId: dpoUser.id,
      ticketNumber: `${data.short.toUpperCase()}-DSAR-001`,
      requestType: DsarRequestType.ACCESS,
      requestedData: ["Profile", "Payments"],
      description: "Need all personal data",
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
      ticketNumber: `${data.short.toUpperCase()}-DSAR-REQ-${String(i).padStart(6, "0")}`,
      requestType:
        i % 2 === 0 ? DsarRequestType.ACCESS : DsarRequestType.DELETION,
      requestedData: ["ProfileInformation", "PaymentLedgerHistoryRecords"],
      description:
        "Requesting localized verification transmission records export profile file download payload link.",
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
      responseType: "ACCESS_EXPORT",
      deliveryMethod: "secure_download",
      notes: "Data exported successfully",
    },
  });

  // 35. Bulk DSAR Responses
  console.log("-> Generating bulk DSAR responses...");
  await prisma.dsarResponse.createMany({
    data: allDsarTickets.map((t) => ({
      dsarTicketId: t.id,
      responseType: "SECURE_ARCHIVE_EXPORT_DISPATCH",
      deliveryMethod: "encrypted_object_download_delivery",
      notes:
        "Telemetry bundle compiled successfully under secure protocol profiles keys verification parameters.",
    })),
  });

  // 36. Payment Transaction (role user)
  console.log("-> Creating payment transactions...");
  const payment = await prisma.paymentTransaction.create({
    data: {
      associationId: association.id,
      userId: memberUser.id,
      amount: new Prisma.Decimal(500),
      currency: "INR",
      gateway: PaymentGateway.RAZORPAY,
      status: PaymentStatus.COMPLETED,
      method: PaymentMethod.UPI,
      referenceNumber: `${data.short}-payment-ref`,
      receiptNumber: `${data.short}-receipt-001`,
      razorpayOrderId: `${data.short}-order-id`,
      razorpayPaymentId: `${data.short}-payment-id`,
      razorpaySignature: "signature",
      receiptUrl: "https://example.com/receipt.pdf",
      invoiceUrl: "https://example.com/invoice.pdf",
      paidAt: new Date(),
      paymentDate: new Date(),
      notes: "Membership payment",
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
      currency: "INR",
      gateway: PaymentGateway.RAZORPAY,
      status: PaymentStatus.COMPLETED,
      method: PaymentMethod.UPI,
      referenceNumber: `TXN-REF-${data.short.toUpperCase()}-${String(i).padStart(6, "0")}`,
      receiptNumber: `REC-${data.short.toUpperCase()}-${String(i).padStart(6, "0")}`,
      razorpayOrderId: `order_id_${data.short}_${String(i).padStart(6, "0")}`,
      razorpayPaymentId: `pay_id_${data.short}_${String(i).padStart(6, "0")}`,
      razorpaySignature: "auth_crypto_signature_verification_string",
      receiptUrl: "https://example.com/receipt.pdf",
      invoiceUrl: "https://example.com/invoice.pdf",
      paidAt: new Date(),
      paymentDate: new Date(),
      notes: "Membership regular subscription tracking fee processing.",
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
  console.log("-> Creating contribution periods...");
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
      dueDate: new Date("2026-05-31"),
    },
  });

  // 39. Bulk Contribution Periods
  console.log("-> Generating bulk contribution periods...");
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
      dueDate: new Date("2026-12-31"),
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
  console.log("-> Generating bulk payment allocations...");
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
  console.log("-> Creating payment webhook events...");
  await prisma.paymentWebhookEvent.create({
    data: {
      eventId: `${data.short}-event-001`,
      eventType: "payment.captured",
      gateway: PaymentGateway.RAZORPAY,
      payload: {
        success: true,
      },
      signature: "webhook-signature",
      processed: true,
      processedAt: new Date(),
    },
  });

  // 43. Bulk Payment Webhook Events
  console.log("-> Generating bulk webhook events...");
  await prisma.paymentWebhookEvent.createMany({
    data: Array.from({ length: 1000 }).map((_, i) => ({
      eventId: `evt_rzp_telemetry_id_string_${i}_${data.short}`,
      eventType: "payment.captured",
      gateway: PaymentGateway.RAZORPAY,
      payload: { system_validated: true, reference: i },
      signature: "webhook_payload_security_authentication_hash",
      processed: true,
      processedAt: new Date(),
    })),
  });

  // 44. Ledger Entry (role user)
  console.log("-> Creating ledger entries...");
  const ledgerEntry = await prisma.ledgerEntry.create({
    data: {
      paymentTransactionId: payment.id,
      description: "Membership fee ledger entry",
      approvalStatus: "APPROVED",
      createdById: financeUser.id,
      approvedById: superAdminUser.id,
    },
  });

  // 45. Ledger Lines (role user)
  await prisma.ledgerLine.createMany({
    data: [
      {
        ledgerEntryId: ledgerEntry.id,
        accountId: "cash-account",
        isDebit: true,
        amount: new Prisma.Decimal(500),
      },
      {
        ledgerEntryId: ledgerEntry.id,
        accountId: "membership-income",
        isDebit: false,
        amount: new Prisma.Decimal(500),
      },
    ],
  });

  // 46. Bulk Ledger Entries
  console.log("-> Generating bulk ledger entries...");
  await prisma.ledgerEntry.createMany({
    data: allPayments.map((p, i) => ({
      paymentTransactionId: p.id,
      description: `Double-entry configuration alignment balancing ledger profile node item-${i}`,
      approvalStatus: "APPROVED",
      createdById: financeUser.id,
      approvedById: superAdminUser.id,
    })),
  });
  const allLedgerEntries = await prisma.ledgerEntry.findMany({
    select: { id: true },
  });

  // 47. Bulk Ledger Lines
  console.log("-> Generating bulk ledger lines...");
  const ledgerLines: Prisma.LedgerLineCreateManyInput[] = [];
  for (let i = 0; i < allLedgerEntries.length; i++) {
    const entryId = allLedgerEntries[i].id;
    ledgerLines.push(
      {
        ledgerEntryId: entryId,
        accountId: "assets-cash-operational-pool",
        isDebit: true,
        amount: new Prisma.Decimal(500),
      },
      {
        ledgerEntryId: entryId,
        accountId: "revenues-membership-dues-pool",
        isDebit: false,
        amount: new Prisma.Decimal(500),
      },
    );
  }
  await prisma.ledgerLine.createMany({ data: ledgerLines });

  // 48. Notification (role user)
  console.log("-> Creating notifications...");
  await prisma.notification.create({
    data: {
      associationId: association.id,
      userId: memberUser.id,
      title: "Payment Successful",
      body: "Your membership payment was successful",
      type: NotificationType.SYSTEM,
      route: "/payments",
      entityId: payment.id,
      isRead: false,
      isReceived: true,
      receivedAt: new Date(),
    },
  });

  // 49. Bulk Notifications
  console.log("-> Generating bulk notifications...");
  await prisma.notification.createMany({
    data: Array.from({ length: 1000 }).map((_, i) => ({
      associationId: association.id,
      userId: getRandomElement(allUsers).id,
      title: "System Update Notification Event Alert",
      body: "An update event profile operation modification transaction has run securely against your user registry space.",
      type: NotificationType.SYSTEM,
      route: "/dashboard/telemetry/profile",
      entityId: getRandomElement(allPayments).id,
      isRead: i % 4 === 0,
      isReceived: true,
      receivedAt: new Date(),
    })),
  });

  // 50. Complaint (role user)
  console.log("-> Creating complaints...");
  await prisma.complaint.create({
    data: {
      associationId: association.id,
      userId: memberUser.id,
      title: "Unable to download receipt",
      description: "Receipt PDF download failing",
      status: ComplaintStatus.OPEN,
      priority: "HIGH",
      assignedToId: secretaryUser.id,
    },
  });

  // 51. Bulk Complaints
  console.log("-> Generating bulk complaints...");
  const complaintsToInsert: Prisma.ComplaintCreateManyInput[] = [];
  for (let i = 1; i <= 1000; i++) {
    complaintsToInsert.push({
      associationId: association.id,
      userId: getRandomElement(allUsers).id,
      title: `Operational Processing Connection Failure interface-${i}`,
      description:
        "User interaction tracking dashboard telemetry object structural parameters parsing delays.",
      status: i % 3 === 0 ? ComplaintStatus.RESOLVED : ComplaintStatus.OPEN,
      priority: i % 5 === 0 ? "HIGH" : "MEDIUM",
      assignedToId: secretaryUser.id,
    });
  }
  await prisma.complaint.createMany({ data: complaintsToInsert });

  // 52. Payment Provider
  console.log("-> Creating payment provider...");
  await prisma.paymentProvider.create({
    data: {
      associationId: association.id,
      provider: "RAZORPAY",
      keyId: encKeyId,
      encryptedKeySecret: encSecret,
      encryptedWebhookSecret: encWebhook,
      isActive: true,
    },
  });

  // 53. Audit Log (role user)
  console.log("-> Creating audit logs...");
  await prisma.auditLog.create({
    data: {
      associationId: association.id,
      actorId: superAdminUser.id,
      action: "CREATE",
      resourceType: "Association",
      resourceId: association.id,
      newValues: {
        name: data.name,
        slug: data.slug,
      },
      ipAddress: "127.0.0.1",
      userAgent: "seed-script",
      traceId: `${data.short}-trace-001`,
    },
  });

  // 54. Bulk Audit Logs
  console.log("-> Generating bulk audit logs...");
  const auditsToInsert: Prisma.AuditLogCreateManyInput[] = [];
  for (let i = 1; i <= 1000; i++) {
    auditsToInsert.push({
      associationId: association.id,
      actorId: getRandomElement(allUsers).id,
      action: "UPDATE",
      resourceType: "OperationalDatabaseNodeRecord",
      resourceId: association.id,
      newValues: {
        validationTimestamp: new Date().toISOString(),
        traceIndex: i,
      },
      ipAddress: `10.0.4.${i % 254}`,
      userAgent: "Security Execution Runner Script Engine Connection Process",
      traceId: `trc-uuid-string-generation-block-${i}-${association.id.slice(0, 8)}`,
    });
  }
  await prisma.auditLog.createMany({ data: auditsToInsert });

  // 55. Compliance Check
  console.log("-> Creating compliance checks...");
  await prisma.complianceCheck.create({
    data: {
      associationId: association.id,
      checkType: "GDPR_CHECK",
      status: ComplianceCheckStatus.PASSED,
      score: 96,
      message: "Association compliant",
      details: {
        encryption: true,
      },
      recommendations: {
        rotateKeys: true,
      },
    },
  });

  // 56. Bulk Compliance Checks
  console.log("-> Generating bulk compliance checks...");
  const complianceChecksToInsert: Prisma.ComplianceCheckCreateManyInput[] = [];
  for (let i = 1; i <= 1000; i++) {
    complianceChecksToInsert.push({
      associationId: association.id,
      checkType: "REGULATORY_SYSTEM_DATA_INTEGRITY_AUDIT",
      status: ComplianceCheckStatus.PASSED,
      score: 90 + (i % 11),
      message:
        "Data system validation checks matching architecture specifications.",
      details: { automatedVerificationCodeRun: true, operationalCheckIdx: i },
      recommendations: { routineLogRotationIntervalDays: 30 },
    });
  }
  await prisma.complianceCheck.createMany({ data: complianceChecksToInsert });

  console.log(`\n✓ ${data.name} seeded successfully`);
  console.log(`\n   Login credentials for ${data.short.toUpperCase()}:`);
  console.log(`   Password: ${process.env.PASSWORD || "securepassword123"}`);
  for (const role of roles) {
    console.log(`   ${role}: ${roleUsers[role].email}`);
  }
}

// -----------------------------------------------------------------------------
// CORE ENTRY EXECUTION
// -----------------------------------------------------------------------------
async function main() {
  console.log("\n--- Initializing Comprehensive Global Database Purge ---");

  await prisma.announcementRead.deleteMany();
  await prisma.meetingMinutes.deleteMany();
  await prisma.agendaItem.deleteMany();
  await prisma.meetingAttendee.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.trainingCompletion.deleteMany();
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
  await prisma.subscriptionPlan.deleteMany();
  await prisma.memberType.deleteMany();
  await prisma.pushToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.verificationCode.deleteMany();
  await prisma.user.deleteMany();
  await prisma.association.deleteMany();

  console.log("✓ Purge complete. Execution space prepared.");

  for (const association of ASSOCIATIONS) {
    await seedAssociation(association);
  }

  console.log(
    "\n🚩 Global High-Scale Performance Database Seed Pipeline Completed Successfully.",
  );
}

main()
  .catch((error) => {
    console.error("Critical Failure in execution pipeline chain:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
