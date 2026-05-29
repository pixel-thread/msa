export interface TrainingModuleWithCompletions {
  id: string;
  associationId: string;
  title: string;
  description: string | null;
  content: string;
  durationMinutes: number | null;
  requiredForRoles: string[];
  version: number;
  isActive: boolean;
  certificateTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
  completions: TrainingCompletionItem[];
}

export interface TrainingCompletionWithModule {
  id: string;
  userId: string;
  moduleId: string;
  scorePercent: number | null;
  completedAt: string;
  module: {
    id: string;
    associationId: string;
    title: string;
    description: string | null;
    content: string;
    durationMinutes: number | null;
    requiredForRoles: string[];
    version: number;
    isActive: boolean;
    certificateTemplateId: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface TrainingModuleListItem {
  id: string;
  title: string;
  description: string | null;
  content: string;
  durationMinutes: number | null;
  requiredForRoles: string[];
  isActive: boolean;
  version: number;
  certificateTemplate: {
    id: string;
    certificateUrl: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingAssignment {
  id: string;
  moduleId: string;
  userId: string;
  assignedById: string;
  status: string;
  assignedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string[];
    status: string;
  };
}

export interface TrainingCompletionItem {
  id: string;
  userId: string;
  moduleId: string;
  scorePercent: number | null;
  completedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  module: {
    id: string;
    title: string;
  };
}

export interface TrainingSupplementItem {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  type: string;
  downloadUrl: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  mimeType: string | null;
  fileId: string;
  fileSize: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingCertificateTemplateItem {
  id: string;
  associationId: string;
  name: string;
  certificateUrl: string;
  thumbnailUrl: string | null;
  fileId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingCertificateItem {
  id: string;
  userId: string;
  moduleId: string;
  certificateNumber: string | null;
  issuedAt: string;
  certificateUrl: string;
  thumbnailUrl: string | null;
  fileId: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AssignedUserWithCompletion {
  id: string;
  moduleId: string;
  userId: string;
  status: string;
  assignedAt: string;
  dueDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string[];
  };
  completion: {
    id: string;
    scorePercent: number | null;
    completedAt: string;
  } | null;
}
