"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var adapter_pg_1 = require("@prisma/adapter-pg");
var client_1 = require("@prisma/client");
var pg_1 = require("pg");
var pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
var adapter = new adapter_pg_1.PrismaPg(pool);
var prisma = new client_1.PrismaClient({ adapter: adapter });
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var mfsa, mpsa, mfsaUsers, mpsaUsers, now, tomorrow, nextWeek, inTwoWeeks, meetings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Seeding database...");
                    return [4 /*yield*/, prisma.association.upsert({
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
                        })];
                case 1:
                    mfsa = _a.sent();
                    return [4 /*yield*/, prisma.association.upsert({
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
                        })];
                case 2:
                    mpsa = _a.sent();
                    console.log("Created associations:", mfsa.name, "&", mpsa.name);
                    return [4 /*yield*/, Promise.all([
                            prisma.user.upsert({
                                where: { associationId_email: { associationId: mfsa.id, email: "president@mfsa.org" } },
                                update: {},
                                create: {
                                    clerkId: "clerk_mfsa_president",
                                    associationId: mfsa.id,
                                    email: "president@mfsa.org",
                                    name: "Rajesh Sharma",
                                    role: client_1.UserRole.PRESIDENT,
                                    membershipNumber: "MFSA-001",
                                },
                            }),
                            prisma.user.upsert({
                                where: { associationId_email: { associationId: mfsa.id, email: "secretary@mfsa.org" } },
                                update: {},
                                create: {
                                    clerkId: "clerk_mfsa_secretary",
                                    associationId: mfsa.id,
                                    email: "secretary@mfsa.org",
                                    name: "Priya Patel",
                                    role: client_1.UserRole.SECRETARY,
                                    membershipNumber: "MFSA-002",
                                },
                            }),
                            prisma.user.upsert({
                                where: { associationId_email: { associationId: mfsa.id, email: "finance@mfsa.org" } },
                                update: {},
                                create: {
                                    clerkId: "clerk_mfsa_finance",
                                    associationId: mfsa.id,
                                    email: "finance@mfsa.org",
                                    name: "Anil Kumar",
                                    role: client_1.UserRole.FINANCE,
                                    membershipNumber: "MFSA-003",
                                },
                            }),
                            prisma.user.upsert({
                                where: { associationId_email: { associationId: mfsa.id, email: "member1@mfsa.org" } },
                                update: {},
                                create: {
                                    clerkId: "clerk_mfsa_member1",
                                    associationId: mfsa.id,
                                    email: "member1@mfsa.org",
                                    name: "Suresh Yadav",
                                    role: client_1.UserRole.MEMBER,
                                    membershipNumber: "MFSA-004",
                                },
                            }),
                            prisma.user.upsert({
                                where: { associationId_email: { associationId: mfsa.id, email: "member2@mfsa.org" } },
                                update: {},
                                create: {
                                    clerkId: "clerk_mfsa_member2",
                                    associationId: mfsa.id,
                                    email: "member2@mfsa.org",
                                    name: "Meera Desai",
                                    role: client_1.UserRole.MEMBER,
                                    membershipNumber: "MFSA-005",
                                },
                            }),
                        ])];
                case 3:
                    mfsaUsers = _a.sent();
                    return [4 /*yield*/, Promise.all([
                            prisma.user.upsert({
                                where: { associationId_email: { associationId: mpsa.id, email: "president@mpsa.org" } },
                                update: {},
                                create: {
                                    clerkId: "clerk_mpsa_president",
                                    associationId: mpsa.id,
                                    email: "president@mpsa.org",
                                    name: "Vikram Singh",
                                    role: client_1.UserRole.PRESIDENT,
                                    membershipNumber: "MPSA-001",
                                },
                            }),
                            prisma.user.upsert({
                                where: { associationId_email: { associationId: mpsa.id, email: "secretary@mpsa.org" } },
                                update: {},
                                create: {
                                    clerkId: "clerk_mpsa_secretary",
                                    associationId: mpsa.id,
                                    email: "secretary@mpsa.org",
                                    name: "Sunita Rao",
                                    role: client_1.UserRole.SECRETARY,
                                    membershipNumber: "MPSA-002",
                                },
                            }),
                            prisma.user.upsert({
                                where: { associationId_email: { associationId: mpsa.id, email: "dpo@mpsa.org" } },
                                update: {},
                                create: {
                                    clerkId: "clerk_mpsa_dpo",
                                    associationId: mpsa.id,
                                    email: "dpo@mpsa.org",
                                    name: "Arjun Nair",
                                    role: client_1.UserRole.DPO,
                                    membershipNumber: "MPSA-003",
                                },
                            }),
                            prisma.user.upsert({
                                where: { associationId_email: { associationId: mpsa.id, email: "member1@mpsa.org" } },
                                update: {},
                                create: {
                                    clerkId: "clerk_mpsa_member1",
                                    associationId: mpsa.id,
                                    email: "member1@mpsa.org",
                                    name: "Lakshmi Iyer",
                                    role: client_1.UserRole.MEMBER,
                                    membershipNumber: "MPSA-004",
                                },
                            }),
                            prisma.user.upsert({
                                where: { associationId_email: { associationId: mpsa.id, email: "member2@mpsa.org" } },
                                update: {},
                                create: {
                                    clerkId: "clerk_mpsa_member2",
                                    associationId: mpsa.id,
                                    email: "member2@mpsa.org",
                                    name: "Ravi Kulkarni",
                                    role: client_1.UserRole.MEMBER,
                                    membershipNumber: "MPSA-005",
                                },
                            }),
                        ])];
                case 4:
                    mpsaUsers = _a.sent();
                    console.log("Created 10 users (5 per association)");
                    now = new Date();
                    tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
                    return [4 /*yield*/, Promise.all([
                            prisma.meeting.upsert({
                                where: { id: "mfsa-meeting-1" },
                                update: {},
                                create: {
                                    id: "mfsa-meeting-1",
                                    associationId: mfsa.id,
                                    title: "Monthly General Meeting - January 2025",
                                    type: client_1.MeetingType.GENERAL_MEETING,
                                    status: client_1.MeetingStatus.SCHEDULED,
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
                                    type: client_1.MeetingType.EC_MEETING,
                                    status: client_1.MeetingStatus.SCHEDULED,
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
                                    type: client_1.MeetingType.GENERAL_MEETING,
                                    status: client_1.MeetingStatus.SCHEDULED,
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
                                    type: client_1.MeetingType.GENERAL_MEETING,
                                    status: client_1.MeetingStatus.SCHEDULED,
                                    scheduledAt: nextWeek,
                                    venue: "MPSA Main Hall, Mumbai Port",
                                    createdById: mpsaUsers[0].id,
                                },
                            }),
                        ])];
                case 5:
                    meetings = _a.sent();
                    console.log("Created 4 meetings (2 per association)");
                    return [4 /*yield*/, Promise.all([
                            prisma.meetingAttendee.upsert({
                                where: { meetingId_userId: { meetingId: meetings[0].id, userId: mfsaUsers[0].id } },
                                update: {},
                                create: {
                                    meetingId: meetings[0].id,
                                    userId: mfsaUsers[0].id,
                                    attendeeRole: client_1.AttendeeRole.REQUIRED,
                                    rsvpStatus: client_1.RsvpStatus.ACCEPTED,
                                    rsvpAt: new Date(),
                                },
                            }),
                            prisma.meetingAttendee.upsert({
                                where: { meetingId_userId: { meetingId: meetings[0].id, userId: mfsaUsers[1].id } },
                                update: {},
                                create: {
                                    meetingId: meetings[0].id,
                                    userId: mfsaUsers[1].id,
                                    attendeeRole: client_1.AttendeeRole.REQUIRED,
                                    rsvpStatus: client_1.RsvpStatus.ACCEPTED,
                                    rsvpAt: new Date(),
                                },
                            }),
                            prisma.meetingAttendee.upsert({
                                where: { meetingId_userId: { meetingId: meetings[0].id, userId: mfsaUsers[2].id } },
                                update: {},
                                create: {
                                    meetingId: meetings[0].id,
                                    userId: mfsaUsers[2].id,
                                    attendeeRole: client_1.AttendeeRole.OPTIONAL,
                                    rsvpStatus: client_1.RsvpStatus.PENDING,
                                },
                            }),
                            prisma.meetingAttendee.upsert({
                                where: { meetingId_userId: { meetingId: meetings[0].id, userId: mfsaUsers[3].id } },
                                update: {},
                                create: {
                                    meetingId: meetings[0].id,
                                    userId: mfsaUsers[3].id,
                                    attendeeRole: client_1.AttendeeRole.REQUIRED,
                                    rsvpStatus: client_1.RsvpStatus.DECLINED,
                                    rsvpNote: "Prior family commitment",
                                    rsvpAt: new Date(),
                                },
                            }),
                            prisma.meetingAttendee.upsert({
                                where: { meetingId_userId: { meetingId: meetings[0].id, userId: mfsaUsers[4].id } },
                                update: {},
                                create: {
                                    meetingId: meetings[0].id,
                                    userId: mfsaUsers[4].id,
                                    attendeeRole: client_1.AttendeeRole.OBSERVER,
                                    rsvpStatus: client_1.RsvpStatus.PENDING,
                                },
                            }),
                            prisma.meetingAttendee.upsert({
                                where: { meetingId_userId: { meetingId: meetings[1].id, userId: mfsaUsers[0].id } },
                                update: {},
                                create: {
                                    meetingId: meetings[1].id,
                                    userId: mfsaUsers[0].id,
                                    attendeeRole: client_1.AttendeeRole.REQUIRED,
                                    rsvpStatus: client_1.RsvpStatus.ACCEPTED,
                                    rsvpAt: new Date(),
                                },
                            }),
                            prisma.meetingAttendee.upsert({
                                where: { meetingId_userId: { meetingId: meetings[1].id, userId: mfsaUsers[1].id } },
                                update: {},
                                create: {
                                    meetingId: meetings[1].id,
                                    userId: mfsaUsers[1].id,
                                    attendeeRole: client_1.AttendeeRole.REQUIRED,
                                    rsvpStatus: client_1.RsvpStatus.ACCEPTED,
                                    rsvpAt: new Date(),
                                },
                            }),
                            prisma.meetingAttendee.upsert({
                                where: { meetingId_userId: { meetingId: meetings[2].id, userId: mpsaUsers[0].id } },
                                update: {},
                                create: {
                                    meetingId: meetings[2].id,
                                    userId: mpsaUsers[0].id,
                                    attendeeRole: client_1.AttendeeRole.REQUIRED,
                                    rsvpStatus: client_1.RsvpStatus.ACCEPTED,
                                    rsvpAt: new Date(),
                                },
                            }),
                            prisma.meetingAttendee.upsert({
                                where: { meetingId_userId: { meetingId: meetings[2].id, userId: mpsaUsers[1].id } },
                                update: {},
                                create: {
                                    meetingId: meetings[2].id,
                                    userId: mpsaUsers[1].id,
                                    attendeeRole: client_1.AttendeeRole.REQUIRED,
                                    rsvpStatus: client_1.RsvpStatus.ACCEPTED,
                                    rsvpAt: new Date(),
                                },
                            }),
                            prisma.meetingAttendee.upsert({
                                where: { meetingId_userId: { meetingId: meetings[2].id, userId: mpsaUsers[2].id } },
                                update: {},
                                create: {
                                    meetingId: meetings[2].id,
                                    userId: mpsaUsers[2].id,
                                    attendeeRole: client_1.AttendeeRole.OPTIONAL,
                                    rsvpStatus: client_1.RsvpStatus.PENDING,
                                },
                            }),
                            prisma.meetingAttendee.upsert({
                                where: { meetingId_userId: { meetingId: meetings[3].id, userId: mpsaUsers[0].id } },
                                update: {},
                                create: {
                                    meetingId: meetings[3].id,
                                    userId: mpsaUsers[0].id,
                                    attendeeRole: client_1.AttendeeRole.REQUIRED,
                                    rsvpStatus: client_1.RsvpStatus.ACCEPTED,
                                    rsvpAt: new Date(),
                                },
                            }),
                            prisma.meetingAttendee.upsert({
                                where: { meetingId_userId: { meetingId: meetings[3].id, userId: mpsaUsers[1].id } },
                                update: {},
                                create: {
                                    meetingId: meetings[3].id,
                                    userId: mpsaUsers[1].id,
                                    attendeeRole: client_1.AttendeeRole.REQUIRED,
                                    rsvpStatus: client_1.RsvpStatus.PENDING,
                                },
                            }),
                        ])];
                case 6:
                    _a.sent();
                    console.log("Created meeting attendees with mixed RSVP statuses");
                    return [4 /*yield*/, Promise.all([
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
                                    description: "Annual election of president, secretary, and committee members",
                                },
                            }),
                        ])];
                case 7:
                    _a.sent();
                    console.log("Created agenda items for meetings");
                    console.log("Seeding complete!");
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [4 /*yield*/, pool.end()];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
