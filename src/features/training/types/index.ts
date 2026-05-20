import { TrainingModule, TrainingCompletion } from "@prisma/client";

export type TrainingModuleWithCompletions = TrainingModule & {
  completions: TrainingCompletion[];
};

export type TrainingCompletionWithModule = TrainingCompletion & {
  module: TrainingModule;
};

export interface TrainingModuleListItem {
  id: string;
  title: string;
  description: string | null;
  content: string;
  durationMinutes: number | null;
  requiredForRoles: string[];
  isActive: boolean;
  version: number;
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
  certificateUrl: string | null;
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

