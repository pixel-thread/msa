import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <Suspense>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full max-w-md",
              card: "w-full shadow-lg",
            },
          }}
        />
      </div>
    </Suspense>
  );
}