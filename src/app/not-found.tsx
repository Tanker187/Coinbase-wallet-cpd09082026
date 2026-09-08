import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-zinc-950 text-zinc-100">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-zinc-400 mb-6">Page not found</p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white font-medium transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
