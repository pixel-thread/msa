import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default async function Home() {
  const { isAuthenticated } = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-gray-900">
      <header className="fixed top-0 w-full p-6 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight">MFSA Connect</h1>
        {isAuthenticated ? (
          <UserButton />
        ) : (
          <div>
            <Link href="/sign-in">Signin</Link>
            <Link href="/sign-signup">Signin</Link>
          </div>
        )}
      </header>

      <main className="text-center px-4 max-w-3xl">
        <h2 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          Security-First Platform for{" "}
          <span className="text-indigo-600">Association Governance</span>
        </h2>
        <p className="mt-6 text-xl text-gray-600 leading-8">
          A unified solution for Meghalaya Finance Service Association and
          affiliated bodies. Manage memberships, meetings, and financial ledger
          with zero compromise on security.
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <Link
            href="/sign-up"
            className="bg-indigo-600 text-white px-8 py-3 rounded-md text-lg font-bold hover:bg-indigo-700 transition shadow-lg"
          >
            Join Now
          </Link>
          <Link
            href="/sign-in"
            className="bg-white text-indigo-600 border border-indigo-600 px-8 py-3 rounded-md text-lg font-bold hover:bg-indigo-50 transition"
          >
            Member Portal
          </Link>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full p-8 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Meghalaya Finance Service Association.
        All rights reserved.
      </footer>
    </div>
  );
}
