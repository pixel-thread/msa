import bcrypt from 'bcryptjs';
import { prisma } from '@src/shared/lib';

type UserRole = 'SUPER_ADMIN' | 'PRESIDENT' | 'SECRETARY' | 'FINANCE' | 'DPO' | 'MEMBER';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ANONYMIZED' | 'PENDING';

interface CreateAssociationParams {
  slug: string;
  name?: string;
  country?: string;
  state?: string;
}

interface CreateUserParams {
  email: string;
  password?: string;
  role: UserRole[];
  associationId: string;
  status?: UserStatus;
  name?: string;
  mobile?: string;
  designation?: string;
  mfaEnabled?: boolean;
  lockedUntil?: Date;
  failedLoginAttempts?: number;
}

export async function createAssociation(params: CreateAssociationParams) {
  return prisma.association.create({
    data: {
      slug: params.slug,
      name: params.name || `Test Association ${params.slug}`,
      country: params.country || 'India',
      state: params.state || 'Karnataka',
    },
  });
}

export async function createUser(params: CreateUserParams) {
  const password = params.password || 'TestPass1!';
  const hashedPassword = await bcrypt.hash(password, 4);

  return prisma.user.create({
    data: {
      email: params.email,
      password: hashedPassword,
      role: params.role,
      associationId: params.associationId,
      status: params.status || 'ACTIVE',
      name: params.name || `Test User ${params.email}`,
      mobile: params.mobile || '9999999999',
      designation: params.designation || 'Member',
      mfaEnabled: params.mfaEnabled || false,
      lockedUntil: params.lockedUntil || null,
      failedLoginAttempts: params.failedLoginAttempts || 0,
    },
  });
}

export async function createAccount(params: {
  code: string;
  name: string;
  type: string;
  associationId: string;
  description?: string;
}) {
  return prisma.account.create({
    data: {
      code: params.code,
      name: params.name,
      type: params.type,
      associationId: params.associationId,
      description: params.description || null,
    },
  });
}

export async function createMeeting(params: {
  title: string;
  type: string;
  scheduledAt: Date;
  associationId: string;
  createdById: string;
  status?: string;
  venue?: string;
}) {
  return prisma.meeting.create({
    data: {
      title: params.title,
      type: params.type,
      scheduledAt: params.scheduledAt,
      associationId: params.associationId,
      createdById: params.createdById,
      status: params.status || 'SCHEDULED',
      venue: params.venue || 'Test Venue',
    },
  });
}

export async function createPayment(params: {
  userId: string;
  associationId: string;
  amount: number;
  status?: string;
  method?: string;
}) {
  return prisma.paymentTransaction.create({
    data: {
      userId: params.userId,
      associationId: params.associationId,
      amount: params.amount,
      status: params.status || 'COMPLETED',
      method: params.method || 'CASH',
    },
  });
}

export async function cleanupByPrefix(prefix: string) {
  const associations = await prisma.association.findMany({
    where: { slug: { startsWith: prefix } },
    select: { id: true },
  });
  const ids = associations.map((r) => r.id);

  if (ids.length === 0) return;

  await prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { user: { associationId: { in: ids } } } }),
    prisma.verificationCode.deleteMany({ where: { user: { associationId: { in: ids } } } }),
    prisma.membershipApplication.deleteMany({ where: { associationSlug: { startsWith: prefix } } }),
    prisma.meeting.deleteMany({ where: { associationId: { in: ids } } }),
    prisma.paymentTransaction.deleteMany({ where: { associationId: { in: ids } } }),
    prisma.account.deleteMany({ where: { associationId: { in: ids } } }),
    prisma.user.deleteMany({ where: { associationId: { in: ids } } }),
    prisma.association.deleteMany({ where: { id: { in: ids } } }),
  ]);
}
