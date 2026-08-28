import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="space-y-4 rounded-xl bg-white p-6 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-teal-700">You are offline</h1>
      <p className="text-slate-600">
        Lessons you have already opened still work — your progress is saved on this device. Anything
        new needs a connection.
      </p>
      <Link
        href="/"
        className="inline-block rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white"
      >
        Try again
      </Link>
    </div>
  );
}
