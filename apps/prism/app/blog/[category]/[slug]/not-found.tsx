import Link from 'next/link';
import { PageContainer } from '@/app/components/PageContainer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white">
      <PageContainer className="py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-lg text-gray-600">Article not found</p>
        <Link
          href="/blog"
          className="mt-8 inline-block text-blue-600 hover:text-blue-800"
        >
          Back to Blog
        </Link>
      </PageContainer>
    </div>
  );
}
