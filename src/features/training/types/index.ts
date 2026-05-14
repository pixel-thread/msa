import { TrainingModule, TrainingCompletion } from "@prisma/client";

export type TrainingModuleWithCompletions = TrainingModule & {
  completions: TrainingCompletion[];
};

export type TrainingCompletionWithModule = TrainingCompletion & {
  module: TrainingModule;
};
