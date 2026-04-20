import { ErrorPage } from '../../../components/ErrorPage';

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
