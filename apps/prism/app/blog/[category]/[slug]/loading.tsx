import { PageContainer } from '@prism/ui/components/PageContainer';
import { Loader } from '@prism/ui/components/loader';

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <PageContainer className="py-16">
        <div className="flex items-center justify-center">
          <Loader />
        </div>
      </PageContainer>
    </div>
  );
}
