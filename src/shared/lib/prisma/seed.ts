import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  UserRole,
  MeetingType,
  MeetingStatus,
  AttendeeRole,
  RsvpStatus,
} from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const mfsa = await prisma.association.upsert({
    where: { slug: "mfsa" },
    update: {},
    create: {
      slug: "mfsa",
      name: "Maharashtra Fishermen Social Association",
      description: "Empowering fishing communities across Maharashtra",
      country: "IN",
      state: "Maharashtra",
      timezone: "Asia/Kolkata",
      currencyCode: "INR",
      primaryColor: "#1e40af",
      secondaryColor: "#3b82f6",
      contactEmail: "contact@mfsa.org",
      contactPhone: "+91-9876543210",
    },
  });

  const mpsa = await prisma.association.upsert({
    where: { slug: "mpsa" },
    update: {},
    create: {
      slug: "mpsa",
      name: "Maharashtra Ports Safety Association",
      description: "Promoting safety standards in Maharashtra ports",
      country: "IN",
      state: "Maharashtra",
      timezone: "Asia/Kolkata",
      currencyCode: "INR",
      primaryColor: "#065f46",
      secondaryColor: "#10b981",
      contactEmail: "contact@mpsa.org",
      contactPhone: "+91-9876543211",
    },
  });

  console.log("Created associations:", mfsa.name, "&", mpsa.name);

  const mfsaUsers = await Promise.all([
    prisma.user.upsert({
      where: {
        associationId_email: {
          associationId: mfsa.id,
          email: "president@mfsa.org",
        },
      },
      update: {},
      create: {
        associationId: mfsa.id,
        email: "president@mfsa.org",
        name: "Rajesh Sharma",
        role: UserRole.PRESIDENT,
        membershipNumber: "MFSA-001",
      },
    }),
    prisma.user.upsert({
      where: {
        associationId_email: {
          associationId: mfsa.id,
          email: "secretary@mfsa.org",
        },
      },
      update: {},
      create: {
        associationId: mfsa.id,
        email: "secretary@mfsa.org",
        name: "Priya Patel",
        role: UserRole.SECRETARY,
        membershipNumber: "MFSA-002",
      },
    }),
    prisma.user.upsert({
      where: {
        associationId_email: {
          associationId: mfsa.id,
          email: "finance@mfsa.org",
        },
      },
      update: {},
      create: {
        associationId: mfsa.id,
        email: "finance@mfsa.org",
        name: "Anil Kumar",
        role: UserRole.FINANCE,
        membershipNumber: "MFSA-003",
      },
    }),
    prisma.user.upsert({
      where: {
        associationId_email: {
          associationId: mfsa.id,
          email: "member1@mfsa.org",
        },
      },
      update: {},
      create: {
        associationId: mfsa.id,
        email: "member1@mfsa.org",
        name: "Suresh Yadav",
        role: UserRole.MEMBER,
        membershipNumber: "MFSA-004",
      },
    }),
    prisma.user.upsert({
      where: {
        associationId_email: {
          associationId: mfsa.id,
          email: "member2@mfsa.org",
        },
      },
      update: {},
      create: {
        associationId: mfsa.id,
        email: "member2@mfsa.org",
        name: "Meera Desai",
        role: UserRole.MEMBER,
        membershipNumber: "MFSA-005",
      },
    }),
  ]);

  const mpsaUsers = await Promise.all([
    prisma.user.upsert({
      where: {
        associationId_email: {
          associationId: mpsa.id,
          email: "president@mpsa.org",
        },
      },
      update: {},
      create: {
        associationId: mpsa.id,
        email: "president@mpsa.org",
        name: "Vikram Singh",
        role: UserRole.PRESIDENT,
        membershipNumber: "MPSA-001",
      },
    }),
    prisma.user.upsert({
      where: {
        associationId_email: {
          associationId: mpsa.id,
          email: "secretary@mpsa.org",
        },
      },
      update: {},
      create: {
        associationId: mpsa.id,
        email: "secretary@mpsa.org",
        name: "Sunita Rao",
        role: UserRole.SECRETARY,
        membershipNumber: "MPSA-002",
      },
    }),
    prisma.user.upsert({
      where: {
        associationId_email: { associationId: mpsa.id, email: "dpo@mpsa.org" },
      },
      update: {},
      create: {
        associationId: mpsa.id,
        email: "dpo@mpsa.org",
        name: "Arjun Nair",
        role: UserRole.DPO,
        membershipNumber: "MPSA-003",
      },
    }),
    prisma.user.upsert({
      where: {
        associationId_email: {
          associationId: mpsa.id,
          email: "member1@mpsa.org",
        },
      },
      update: {},
      create: {
        associationId: mpsa.id,
        email: "member1@mpsa.org",
        name: "Lakshmi Iyer",
        role: UserRole.MEMBER,
        membershipNumber: "MPSA-004",
      },
    }),
    prisma.user.upsert({
      where: {
        associationId_email: {
          associationId: mpsa.id,
          email: "member2@mpsa.org",
        },
      },
      update: {},
      create: {
        associationId: mpsa.id,
        email: "member2@mpsa.org",
        name: "Ravi Kulkarni",
        role: UserRole.MEMBER,
        membershipNumber: "MPSA-005",
      },
    }),
  ]);

  console.log("Created 10 users (5 per association)");

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const meetings = await Promise.all([
    prisma.meeting.upsert({
      where: { id: "mfsa-meeting-1" },
      update: {},
      create: {
        id: "mfsa-meeting-1",
        associationId: mfsa.id,
        title: "Monthly General Meeting - January 2025",
        type: MeetingType.GENERAL_MEETING,
        status: MeetingStatus.SCHEDULED,
        scheduledAt: tomorrow,
        venue: "MFSA Community Hall, Mumbai",
        createdById: mfsaUsers[0].id,
      },
    }),
    prisma.meeting.upsert({
      where: { id: "mfsa-meeting-2" },
      update: {},
      create: {
        id: "mfsa-meeting-2",
        associationId: mfsa.id,
        title: "Executive Committee Review Q1",
        type: MeetingType.EC_MEETING,
        status: MeetingStatus.SCHEDULED,
        scheduledAt: nextWeek,
        venue: "MFSA Conference Room",
        createdById: mfsaUsers[1].id,
      },
    }),
    prisma.meeting.upsert({
      where: { id: "mpsa-meeting-1" },
      update: {},
      create: {
        id: "mpsa-meeting-1",
        associationId: mpsa.id,
        title: "Port Safety Standards Workshop",
        type: MeetingType.GENERAL_MEETING,
        status: MeetingStatus.SCHEDULED,
        scheduledAt: inTwoWeeks,
        venue: "MPSA Training Center, JNPT",
        createdById: mpsaUsers[0].id,
      },
    }),
    prisma.meeting.upsert({
      where: { id: "mpsa-meeting-2" },
      update: {},
      create: {
        id: "mpsa-meeting-2",
        associationId: mpsa.id,
        title: "Annual General Meeting 2025",
        type: MeetingType.GENERAL_MEETING,
        status: MeetingStatus.SCHEDULED,
        scheduledAt: nextWeek,
        venue: "MPSA Main Hall, Mumbai Port",
        createdById: mpsaUsers[0].id,
      },
    }),
  ]);

  console.log("Created 4 meetings (2 per association)");

  await Promise.all([
    prisma.meetingAttendee.upsert({
      where: {
        meetingId_userId: {
          meetingId: meetings[0].id,
          userId: mfsaUsers[0].id,
        },
      },
      update: {},
      create: {
        meetingId: meetings[0].id,
        userId: mfsaUsers[0].id,
        attendeeRole: AttendeeRole.REQUIRED,
        rsvpStatus: RsvpStatus.ACCEPTED,
        rsvpAt: new Date(),
      },
    }),
    prisma.meetingAttendee.upsert({
      where: {
        meetingId_userId: {
          meetingId: meetings[0].id,
          userId: mfsaUsers[1].id,
        },
      },
      update: {},
      create: {
        meetingId: meetings[0].id,
        userId: mfsaUsers[1].id,
        attendeeRole: AttendeeRole.REQUIRED,
        rsvpStatus: RsvpStatus.ACCEPTED,
        rsvpAt: new Date(),
      },
    }),
    prisma.meetingAttendee.upsert({
      where: {
        meetingId_userId: {
          meetingId: meetings[0].id,
          userId: mfsaUsers[2].id,
        },
      },
      update: {},
      create: {
        meetingId: meetings[0].id,
        userId: mfsaUsers[2].id,
        attendeeRole: AttendeeRole.OPTIONAL,
        rsvpStatus: RsvpStatus.PENDING,
      },
    }),
    prisma.meetingAttendee.upsert({
      where: {
        meetingId_userId: {
          meetingId: meetings[0].id,
          userId: mfsaUsers[3].id,
        },
      },
      update: {},
      create: {
        meetingId: meetings[0].id,
        userId: mfsaUsers[3].id,
        attendeeRole: AttendeeRole.REQUIRED,
        rsvpStatus: RsvpStatus.DECLINED,
        rsvpNote: "Prior family commitment",
        rsvpAt: new Date(),
      },
    }),
    prisma.meetingAttendee.upsert({
      where: {
        meetingId_userId: {
          meetingId: meetings[0].id,
          userId: mfsaUsers[4].id,
        },
      },
      update: {},
      create: {
        meetingId: meetings[0].id,
        userId: mfsaUsers[4].id,
        attendeeRole: AttendeeRole.OBSERVER,
        rsvpStatus: RsvpStatus.PENDING,
      },
    }),
    prisma.meetingAttendee.upsert({
      where: {
        meetingId_userId: {
          meetingId: meetings[1].id,
          userId: mfsaUsers[0].id,
        },
      },
      update: {},
      create: {
        meetingId: meetings[1].id,
        userId: mfsaUsers[0].id,
        attendeeRole: AttendeeRole.REQUIRED,
        rsvpStatus: RsvpStatus.ACCEPTED,
        rsvpAt: new Date(),
      },
    }),
    prisma.meetingAttendee.upsert({
      where: {
        meetingId_userId: {
          meetingId: meetings[1].id,
          userId: mfsaUsers[1].id,
        },
      },
      update: {},
      create: {
        meetingId: meetings[1].id,
        userId: mfsaUsers[1].id,
        attendeeRole: AttendeeRole.REQUIRED,
        rsvpStatus: RsvpStatus.ACCEPTED,
        rsvpAt: new Date(),
      },
    }),
    prisma.meetingAttendee.upsert({
      where: {
        meetingId_userId: {
          meetingId: meetings[2].id,
          userId: mpsaUsers[0].id,
        },
      },
      update: {},
      create: {
        meetingId: meetings[2].id,
        userId: mpsaUsers[0].id,
        attendeeRole: AttendeeRole.REQUIRED,
        rsvpStatus: RsvpStatus.ACCEPTED,
        rsvpAt: new Date(),
      },
    }),
    prisma.meetingAttendee.upsert({
      where: {
        meetingId_userId: {
          meetingId: meetings[2].id,
          userId: mpsaUsers[1].id,
        },
      },
      update: {},
      create: {
        meetingId: meetings[2].id,
        userId: mpsaUsers[1].id,
        attendeeRole: AttendeeRole.REQUIRED,
        rsvpStatus: RsvpStatus.ACCEPTED,
        rsvpAt: new Date(),
      },
    }),
    prisma.meetingAttendee.upsert({
      where: {
        meetingId_userId: {
          meetingId: meetings[2].id,
          userId: mpsaUsers[2].id,
        },
      },
      update: {},
      create: {
        meetingId: meetings[2].id,
        userId: mpsaUsers[2].id,
        attendeeRole: AttendeeRole.OPTIONAL,
        rsvpStatus: RsvpStatus.PENDING,
      },
    }),
    prisma.meetingAttendee.upsert({
      where: {
        meetingId_userId: {
          meetingId: meetings[3].id,
          userId: mpsaUsers[0].id,
        },
      },
      update: {},
      create: {
        meetingId: meetings[3].id,
        userId: mpsaUsers[0].id,
        attendeeRole: AttendeeRole.REQUIRED,
        rsvpStatus: RsvpStatus.ACCEPTED,
        rsvpAt: new Date(),
      },
    }),
    prisma.meetingAttendee.upsert({
      where: {
        meetingId_userId: {
          meetingId: meetings[3].id,
          userId: mpsaUsers[1].id,
        },
      },
      update: {},
      create: {
        meetingId: meetings[3].id,
        userId: mpsaUsers[1].id,
        attendeeRole: AttendeeRole.REQUIRED,
        rsvpStatus: RsvpStatus.PENDING,
      },
    }),
  ]);

  console.log("Created meeting attendees with mixed RSVP statuses");

  await Promise.all([
    prisma.agendaItem.upsert({
      where: { id: "mfsa-agenda-1-1" },
      update: {},
      create: {
        id: "mfsa-agenda-1-1",
        meetingId: meetings[0].id,
        order: 1,
        title: "Opening Prayer & National Anthem",
        description: "Traditional opening of the meeting",
      },
    }),
    prisma.agendaItem.upsert({
      where: { id: "mfsa-agenda-1-2" },
      update: {},
      create: {
        id: "mfsa-agenda-1-2",
        meetingId: meetings[0].id,
        order: 2,
        title: "Review of Previous Meeting Minutes",
        description: "Discussion on action items from last meeting",
      },
    }),
    prisma.agendaItem.upsert({
      where: { id: "mfsa-agenda-1-3" },
      update: {},
      create: {
        id: "mfsa-agenda-1-3",
        meetingId: meetings[0].id,
        order: 3,
        title: "Treasurer's Report",
        description: "Monthly financial overview",
      },
    }),
    prisma.agendaItem.upsert({
      where: { id: "mfsa-agenda-2-1" },
      update: {},
      create: {
        id: "mfsa-agenda-2-1",
        meetingId: meetings[1].id,
        order: 1,
        title: "Q1 Performance Review",
        description: "Review of first quarter activities and outcomes",
      },
    }),
    prisma.agendaItem.upsert({
      where: { id: "mfsa-agenda-2-2" },
      update: {},
      create: {
        id: "mfsa-agenda-2-2",
        meetingId: meetings[1].id,
        order: 2,
        title: "Budget Allocation Discussion",
        description: "Review and approve Q2 budget",
      },
    }),
    prisma.agendaItem.upsert({
      where: { id: "mpsa-agenda-1-1" },
      update: {},
      create: {
        id: "mpsa-agenda-1-1",
        meetingId: meetings[2].id,
        order: 1,
        title: "Port Safety Protocol Updates",
        description: "Review latest safety guidelines from maritime authority",
      },
    }),
    prisma.agendaItem.upsert({
      where: { id: "mpsa-agenda-2-1" },
      update: {},
      create: {
        id: "mpsa-agenda-2-1",
        meetingId: meetings[3].id,
        order: 1,
        title: "Annual Report Presentation",
        description: "Review of association's yearly performance",
      },
    }),
    prisma.agendaItem.upsert({
      where: { id: "mpsa-agenda-2-2" },
      update: {},
      create: {
        id: "mpsa-agenda-2-2",
        meetingId: meetings[3].id,
        order: 2,
        title: "Election of Office Bearers",
        description:
          "Annual election of president, secretary, and committee members",
      },
    }),
  ]);

  console.log("Created agenda items for meetings");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
