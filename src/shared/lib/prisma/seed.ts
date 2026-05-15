import {
  PrismaClient,
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
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// 2. Explicitly pass the URL to avoid the "Edge" logic trigger
const createPrisma = () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};
const prisma = createPrisma();

async function main() {
  console.log("--- Cleaning up database ---");
  // Order matters due to foreign key constraints
  await prisma.association.deleteMany();
  await prisma.paymentAllocation.deleteMany();
  await prisma.contributionPeriod.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.meetingAttendee.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.dsarTicket.deleteMany();
  await prisma.consentReceipt.deleteMany();
  await prisma.user.deleteMany();

  console.log("--- Seeding Associations ---");
  const mfsa = await prisma.association.create({
    data: {
      slug: "mfsa",
      name: "Meghalaya Finance Service Association",
      description: "The apex body for finance professionals in Meghalaya.",
      primaryColor: "#1e3a8a",
      secondaryColor: "#3b82f6",
    },
  });

  console.log("--- Seeding Subscription Plans ---");
  const standardPlan = await prisma.subscriptionPlan.create({
    data: {
      associationId: mfsa.id,
      name: "Standard Membership",
      amount: 500,
      billingCycle: "MONTHLY",
      features: { voting: true, newsletter: true },
    },
  });

  console.log("--- Seeding Users ---");
  // 1. Super Admin
  const hashPass = await hashPassword(process.env.PASSWORD!);
  const admin = await prisma.user.create({
    data: {
      associationId: mfsa.id,
      email: "admin@mfsa.org",
      name: "MFSA ADMIN",
      role: [UserRole.SUPER_ADMIN],
      password: hashPass,
      status: UserStatus.ACTIVE,
      membershipNumber: "MFSA-001",
    },
  });

  // 2. Regular Members
  const member1 = await prisma.user.create({
    data: {
      associationId: mfsa.id,
      email: "member1@example.com",
      name: "John Doe",
      role: [UserRole.MEMBER],
      status: UserStatus.ACTIVE,
      membershipNumber: "MFSA-102",
      subscription: {
        create: {
          planId: standardPlan.id,
          status: "ACTIVE",
          endDate: new Date("2027-01-01"),
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      associationId: mfsa.id,
      email: "member2@example.com",
      name: "Jane Smith",
      role: [UserRole.MEMBER],
      status: UserStatus.PENDING,
      membershipNumber: "MFSA-103",
    },
  });

  console.log("--- Seeding Meetings & Attendance ---");
  // Meeting 1: General Meeting (Assigned to all)
  const generalMeeting = await prisma.meeting.create({
    data: {
      associationId: mfsa.id,
      title: "Annual General Body Meeting 2026",
      type: MeetingType.GENERAL_MEETING,
      status: MeetingStatus.SCHEDULED,
      scheduledAt: new Date("2026-06-15T10:00:00Z"),
      venue: "State Convention Centre, Shillong",
      createdById: admin.id,
    },
  });

  await prisma.meetingAttendee.createMany({
    data: [
      {
        meetingId: generalMeeting.id,
        userId: admin.id,
        attendeeRole: AttendeeRole.REQUIRED,
        rsvpStatus: RsvpStatus.ACCEPTED,
      },
      {
        meetingId: generalMeeting.id,
        userId: member1.id,
        attendeeRole: AttendeeRole.OPTIONAL,
        rsvpStatus: RsvpStatus.PENDING,
      },
    ],
  });

  // Meeting 2: Executive Committee (Only Admin)
  await prisma.meeting.create({
    data: {
      associationId: mfsa.id,
      title: "EC Strategy Session",
      type: MeetingType.EC_MEETING,
      status: MeetingStatus.NOTICE_ISSUED,
      scheduledAt: new Date("2026-05-20T14:00:00Z"),
      createdById: admin.id,
      attendees: {
        create: {
          userId: admin.id,
          attendeeRole: AttendeeRole.REQUIRED,
        },
      },
    },
  });

  console.log("--- Seeding Privacy Data (Consent & DSAR) ---");
  await prisma.consentReceipt.create({
    data: {
      associationId: mfsa.id,
      userId: member1.id,
      purpose: ConsentPurpose.PAYMENTS,
      status: ConsentStatus.GRANTED,
      ipAddress: "192.168.1.1",
    },
  });

  await prisma.dsarTicket.create({
    data: {
      associationId: mfsa.id,
      userId: member1.id,
      ticketNumber: "DSAR-2026-001",
      requestType: DsarRequestType.ACCESS,
      requestedData: ["Personal Profile", "Payment History"],
      status: DsarStatus.IN_PROGRESS,
      assignedToId: admin.id,
    },
  });

  console.log("--- Seeding Payments ---");
  const transaction = await prisma.paymentTransaction.create({
    data: {
      associationId: mfsa.id,
      userId: member1.id,
      amount: 500,
      status: PaymentStatus.COMPLETED,
      gateway: PaymentGateway.RAZORPAY,
      method: PaymentMethod.UPI,
      referenceNumber: "pay_ABC123xyz",
      paidAt: new Date(),
    },
  });

  // Create contribution period and link to transaction
  const period = await prisma.contributionPeriod.create({
    data: {
      associationId: mfsa.id,
      userId: member1.id,
      year: 2026,
      month: 5,
      expectedAmount: 500,
      paidAmount: 500,
      dueAmount: 0,
      status: "PAID",
      dueDate: new Date("2026-05-31"),
    },
  });

  await prisma.paymentAllocation.create({
    data: {
      paymentTransactionId: transaction.id,
      contributionPeriodId: period.id,
      allocatedAmount: 500,
    },
  });

  console.log("--- Seed Completed Successfully ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
