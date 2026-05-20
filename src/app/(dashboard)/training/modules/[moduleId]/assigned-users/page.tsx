"use client";

import { useParams, useRouter } from "next/navigation";
import { AssignedUsersPage } from "@src/features/training/pages";
import { useTrainingModule } from "@src/features/training/hooks";

export default function ModuleAssignedUsersRoute() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.moduleId as string;

  const { module, isLoading } = useTrainingModule(moduleId);

  if (isLoading) {
    return <div className="py-24 text-center text-body">Loading...</div>;
  }

  if (!module) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-xl font-bold text-ink mb-2">Module Not Found</h2>
        <p className="text-body mb-6">The training module does not exist or has been removed.</p>
        <button
          onClick={() => router.push("/training")}
          className="text-primary hover:underline text-sm font-medium"
        >
          Back to Training Portal
        </button>
      </div>
    );
  }

  return <AssignedUsersPage moduleId={moduleId} moduleTitle={module.title} />;
}
