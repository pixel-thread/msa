import 'server-only';
import { ApplicationStatus, Prisma, UserRole } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';
import { generateRandomPassword, hashPassword } from '@src/shared/lib/password';
import { ConflictError, NotFoundError } from '@src/shared/errors';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { PAGE_SIZE } from '@src/shared/constants';

type CreateApplicationProps = {
  email: string;
  phone: string;
  associationSlug: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  age: number;
  gender: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
};

export async function createMembershipApplication(data: CreateApplicationProps) {
  const existing = await prisma.membershipApplication.findFirst({
    where: {
      OR: [
        {
          email: data.email,
          associationSlug: data.associationSlug,
        },
        {
          phone: data.phone,
          associationSlug: data.associationSlug,
        },
      ],
    },
  });

  if (existing) {
    if (existing.email === data.email) {
      throw new ConflictError('An application with this email already exists for this association');
    }
    throw new ConflictError(
      'An application with this phone number already exists for this association',
    );
  }

  return prisma.membershipApplication.create({
    data: {
      email: data.email,
      phone: data.phone,
      associationSlug: data.associationSlug,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: new Date(data.dateOfBirth),
      age: data.age,
      gender: data.gender,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
    },
  });
}

type GetApplicationsProps = {
  where?: Prisma.MembershipApplicationWhereInput;
  page?: number;
};

export async function getMembershipApplications({ where = {}, page = 1 }: GetApplicationsProps) {
  const pageSize = PAGE_SIZE;
  const skip = (page - 1) * pageSize;

  const [applications, total] = await Promise.all([
    prisma.membershipApplication.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.membershipApplication.count({ where }),
  ]);

  return {
    data: applications,
    pagination: buildPagination(total, page),
  };
}

export async function getMembershipApplication(
  where: Prisma.MembershipApplicationWhereUniqueInput,
) {
  return prisma.membershipApplication.findUnique({ where });
}

type ApproveApplicationProps = {
  applicationId: string;
  memberTypeId: string;
  role?: UserRole;
  dateOfJoiningGovt?: Date;
  reviewedBy: string;
};

export async function approveMembershipApplication({
  applicationId,
  memberTypeId,
  role = UserRole.MEMBER,
  dateOfJoiningGovt,
  reviewedBy,
}: ApproveApplicationProps) {
  const application = await prisma.membershipApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new NotFoundError('Membership application not found');
  }

  if (application.status === ApplicationStatus.APPROVED) {
    throw new ConflictError('Application has already been approved');
  }

  if (application.status === ApplicationStatus.REJECTED) {
    throw new ConflictError('Application has been rejected and cannot be approved');
  }

  const association = await prisma.association.findFirst({
    where: { slug: application.associationSlug },
    select: { id: true },
  });

  if (!association) {
    throw new NotFoundError('Association not found');
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      email: application.email,
      associationId: association.id,
    },
  });

  if (existingUser) {
    throw new ConflictError('A user with this email already exists in the association');
  }

  const randomPassword = generateRandomPassword();

  const hashedPassword = await hashPassword(randomPassword);

  const user = await prisma.user.create({
    data: {
      email: application.email,
      name: `${application.firstName} ${application.lastName}`,
      mobile: application.phone,
      associationId: association.id,
      role: [role],
      status: 'ACTIVE',
      memberTypeId,
      dateOfJoiningGovt: dateOfJoiningGovt || new Date(),
      dateOfJoiningAssociation: new Date(),
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });

  const updatedApplication = await prisma.membershipApplication.update({
    where: { id: applicationId },
    data: {
      status: ApplicationStatus.APPROVED,
      reviewedAt: new Date(),
      reviewedBy,
    },
  });

  return {
    user,
    application: updatedApplication,
    tempPassword: randomPassword,
  };
}

type RejectApplicationProps = {
  applicationId: string;
  rejectionReason: string;
  reviewedBy: string;
};

export async function rejectMembershipApplication({
  applicationId,
  rejectionReason,
  reviewedBy,
}: RejectApplicationProps) {
  const application = await prisma.membershipApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new NotFoundError('Membership application not found');
  }

  if (application.status !== ApplicationStatus.PENDING) {
    throw new ConflictError('Application can only be rejected if it is pending');
  }

  return prisma.membershipApplication.update({
    where: { id: applicationId },
    data: {
      status: ApplicationStatus.REJECTED,
      rejectionReason,
      reviewedAt: new Date(),
      reviewedBy,
    },
  });
}
