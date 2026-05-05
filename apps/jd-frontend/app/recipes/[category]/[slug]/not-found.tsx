import { ErrorPage } from '@/shared/ui/ErrorPage';

export default function NotFound() {
  return (
    <ErrorPage
      title="404"
      message="Recipe not found"
      backHref="/recipes"
      backLabel="Back to Recipes"
    />
  );
}
