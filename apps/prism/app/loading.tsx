export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="space-y-2 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900 mx-auto" />
        <p className="text-sm text-gray-500">Loading Prism experience…</p>
      </div>
    </div>
  );
}
