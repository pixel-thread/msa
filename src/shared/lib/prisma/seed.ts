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
// PRISMA
// -----------------------------------------------------------------------------

const createPrisma = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
  });
};

const prisma = createPrisma();

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

function buildUserEmail(role: UserRole, association: string) {
  return `${role.toLowerCase()}@${association}.org`;
}

function buildUserName(role: UserRole, association: string) {
  return `${association.toUpperCase()} ${role.replaceAll("_", " ")}`;
}

// -----------------------------------------------------------------------------
// SEED CONFIG
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

// -----------------------------------------------------------------------------
// SEED ASSOCIATION
// -----------------------------------------------------------------------------

async function seedAssociation(data: (typeof ASSOCIATIONS)[number]) {
  console.log(`\n--- Seeding ${data.name} ---`);

  const password = await hashPassword(process.env.PASSWORD!);

  // ---------------------------------------------------------------------------
  // ASSOCIATION
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // MEMBER TYPES
  // ---------------------------------------------------------------------------

  await prisma.memberType.createMany({
    data: [
      {
        associationId: association.id,
        description: "Regular Member",
        lavel: 1,
      },
      {
        associationId: association.id,
        description: "Executive Member",
        lavel: 2,
      },
      {
        associationId: association.id,
        description: "Honorary Member",
        lavel: 3,
      },
    ],
  });

  // ---------------------------------------------------------------------------
  // SUBSCRIPTION PLAN
  // ---------------------------------------------------------------------------

  const subscriptionPlan = await prisma.subscriptionPlan.create({
    data: {
      associationId: association.id,
      name: "Standard Membership",
      description: "Default membership plan",
      amount: new Prisma.Decimal(500),
      billingCycle: "MONTHLY",
      features: {
        voting: true,
        newsletter: true,
        events: true,
      },
    },
  });

  // ---------------------------------------------------------------------------
  // USERS
  // ---------------------------------------------------------------------------

  const roles = [
    UserRole.SUPER_ADMIN,
    UserRole.PRESIDENT,
    UserRole.SECRETARY,
    UserRole.FINANCE,
    UserRole.DPO,
    UserRole.MEMBER,
  ];

  const users: Record<UserRole, any> = {} as any;

  for (const role of roles) {
    const user = await prisma.user.create({
      data: {
        associationId: association.id,
        email: buildUserEmail(role, data.short),
        name: buildUserName(role, data.short),
        mobile: "9999999999",
        designation: role,
        role: [role],
        password,
        status: UserStatus.ACTIVE,
        membershipNumber: `${data.short.toUpperCase()}-${role}`,
        imageUrl: "https://placehold.co/300x300",
        mfaEnabled: false,

        subscription:
          role === UserRole.MEMBER
            ? {
                create: {
                  planId: subscriptionPlan.id,
                  status: "ACTIVE",
                  endDate: new Date("2027-01-01"),
                },
              }
            : undefined,
      },
    });

    users[role] = user;
  }

  // ---------------------------------------------------------------------------
  // PUSH TOKENS
  // ---------------------------------------------------------------------------

  for (const role of roles) {
    await prisma.pushToken.create({
      data: {
        userId: users[role].id,
        token: `${data.short}-${role}-push-token`,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // REFRESH TOKENS
  // ---------------------------------------------------------------------------

  for (const role of roles) {
    await prisma.refreshToken.create({
      data: {
        userId: users[role].id,
        token: `${data.short}-${role}-refresh-token`,
        expiresAt: new Date("2027-01-01"),
      },
    });
  }

  // ---------------------------------------------------------------------------
  // VERIFICATION CODE
  // ---------------------------------------------------------------------------

  await prisma.verificationCode.create({
    data: {
      userId: users[UserRole.MEMBER].id,
      code: "123456",
      type: "EMAIL_VERIFICATION",
      expiresAt: new Date(Date.now() + 1000 * 60 * 10),
    },
  });

  // ---------------------------------------------------------------------------
  // MEETING
  // ---------------------------------------------------------------------------

  const meeting = await prisma.meeting.create({
    data: {
      associationId: association.id,
      title: `${data.short.toUpperCase()} Annual General Meeting`,
      type: MeetingType.GENERAL_MEETING,
      status: MeetingStatus.SCHEDULED,
      scheduledAt: new Date("2026-06-15T10:00:00Z"),
      venue: "Shillong Convention Hall",
      createdById: users[UserRole.SUPER_ADMIN].id,
    },
  });

  // ---------------------------------------------------------------------------
  // MEETING ATTENDEES
  // ---------------------------------------------------------------------------

  await prisma.meetingAttendee.createMany({
    data: roles.map((role) => ({
      meetingId: meeting.id,
      userId: users[role].id,
      attendeeRole: AttendeeRole.REQUIRED,
      rsvpStatus:
        role === UserRole.SUPER_ADMIN
          ? RsvpStatus.ACCEPTED
          : RsvpStatus.PENDING,
    })),
  });

  // ---------------------------------------------------------------------------
  // AGENDA ITEMS
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // MEETING MINUTES
  // ---------------------------------------------------------------------------

  await prisma.meetingMinutes.create({
    data: {
      meetingId: meeting.id,
      agendaPoint: "Financial Report",
      decision: "Budget approved unanimously",
      actionItems: [
        {
          assignee: users[UserRole.FINANCE].name,
          task: "Prepare next quarter report",
        },
      ],
    },
  });

  // ---------------------------------------------------------------------------
  // TRAINING MODULE
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // TRAINING ASSIGNMENTS
  // ---------------------------------------------------------------------------

  await prisma.trainingAssignment.createMany({
    data: [
      {
        moduleId: trainingModule.id,
        userId: users[UserRole.MEMBER].id,
        status: TrainingAssignmentStatus.ASSIGNED,
      },
      {
        moduleId: trainingModule.id,
        userId: users[UserRole.SECRETARY].id,
        status: TrainingAssignmentStatus.IN_PROGRESS,
      },
    ],
  });

  // ---------------------------------------------------------------------------
  // TRAINING COMPLETION
  // ---------------------------------------------------------------------------

  await prisma.trainingCompletion.create({
    data: {
      moduleId: trainingModule.id,
      userId: users[UserRole.SECRETARY].id,
      scorePercent: new Prisma.Decimal(95),
      certificateUrl: "https://example.com/certificate.pdf",
    },
  });

  // ---------------------------------------------------------------------------
  // ANNOUNCEMENT
  // ---------------------------------------------------------------------------

  const announcement = await prisma.announcement.create({
    data: {
      associationId: association.id,
      authorId: users[UserRole.PRESIDENT].id,
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

  // ---------------------------------------------------------------------------
  // ANNOUNCEMENT READ
  // ---------------------------------------------------------------------------

  await prisma.announcementRead.create({
    data: {
      announcementId: announcement.id,
      userId: users[UserRole.MEMBER].id,
    },
  });

  // ---------------------------------------------------------------------------
  // CONSENT RECEIPT
  // ---------------------------------------------------------------------------

  await prisma.consentReceipt.create({
    data: {
      associationId: association.id,
      userId: users[UserRole.MEMBER].id,
      purpose: ConsentPurpose.PAYMENTS,
      status: ConsentStatus.GRANTED,
      ipAddress: "127.0.0.1",
      userAgent: "seed-script",
      channel: "web",
    },
  });

  // ---------------------------------------------------------------------------
  // DSAR TICKET
  // ---------------------------------------------------------------------------

  const dsarTicket = await prisma.dsarTicket.create({
    data: {
      associationId: association.id,
      userId: users[UserRole.MEMBER].id,
      assignedToId: users[UserRole.DPO].id,
      ticketNumber: `${data.short.toUpperCase()}-DSAR-001`,
      requestType: DsarRequestType.ACCESS,
      requestedData: ["Profile", "Payments"],
      description: "Need all personal data",
      status: DsarStatus.IN_PROGRESS,
    },
  });

  // ---------------------------------------------------------------------------
  // DSAR RESPONSE
  // ---------------------------------------------------------------------------

  await prisma.dsarResponse.create({
    data: {
      dsarTicketId: dsarTicket.id,
      responseType: "ACCESS_EXPORT",
      deliveryMethod: "secure_download",
      notes: "Data exported successfully",
    },
  });

  // ---------------------------------------------------------------------------
  // PAYMENT TRANSACTION
  // ---------------------------------------------------------------------------

  const payment = await prisma.paymentTransaction.create({
    data: {
      associationId: association.id,
      userId: users[UserRole.MEMBER].id,
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
      notes: "Membership payment",
      createdById: users[UserRole.FINANCE].id,
      verifiedById: users[UserRole.SUPER_ADMIN].id,
    },
  });

  // ---------------------------------------------------------------------------
  // CONTRIBUTION PERIOD
  // ---------------------------------------------------------------------------

  const contributionPeriod = await prisma.contributionPeriod.create({
    data: {
      associationId: association.id,
      userId: users[UserRole.MEMBER].id,
      year: 2026,
      month: 5,
      expectedAmount: new Prisma.Decimal(500),
      paidAmount: new Prisma.Decimal(500),
      dueAmount: new Prisma.Decimal(0),
      status: ContributionStatus.PAID,
      dueDate: new Date("2026-05-31"),
    },
  });

  // ---------------------------------------------------------------------------
  // PAYMENT ALLOCATION
  // ---------------------------------------------------------------------------

  await prisma.paymentAllocation.create({
    data: {
      paymentTransactionId: payment.id,
      contributionPeriodId: contributionPeriod.id,
      allocatedAmount: new Prisma.Decimal(500),
    },
  });

  // ---------------------------------------------------------------------------
  // PAYMENT WEBHOOK EVENT
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // LEDGER ENTRY
  // ---------------------------------------------------------------------------

  const ledgerEntry = await prisma.ledgerEntry.create({
    data: {
      paymentTransactionId: payment.id,
      description: "Membership fee ledger entry",
      approvalStatus: "APPROVED",
      createdById: users[UserRole.FINANCE].id,
      approvedById: users[UserRole.SUPER_ADMIN].id,
    },
  });

  // ---------------------------------------------------------------------------
  // LEDGER LINES
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // NOTIFICATION
  // ---------------------------------------------------------------------------

  await prisma.notification.create({
    data: {
      associationId: association.id,
      userId: users[UserRole.MEMBER].id,
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

  // ---------------------------------------------------------------------------
  // COMPLAINT
  // ---------------------------------------------------------------------------

  await prisma.complaint.create({
    data: {
      associationId: association.id,
      userId: users[UserRole.MEMBER].id,
      title: "Unable to download receipt",
      description: "Receipt PDF download failing",
      status: ComplaintStatus.OPEN,
      priority: "HIGH",
    },
  });

  // ---------------------------------------------------------------------------
  // COMPLIANCE CHECK
  // ---------------------------------------------------------------------------

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

  console.log(`✓ ${data.name} seeded successfully`);
}

// -----------------------------------------------------------------------------
// MAIN
// -----------------------------------------------------------------------------

async function main() {
  console.log("\n--- Cleaning Database ---");

  await prisma.association.deleteMany();

  for (const association of ASSOCIATIONS) {
    await seedAssociation(association);
  }

  console.log("\n✓ Database Seed Completed Successfully");
}

// -----------------------------------------------------------------------------
// RUN
// -----------------------------------------------------------------------------

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
