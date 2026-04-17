import { permanentRedirect } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
}

export default async function LegacyCategoryPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const qs = new URLSearchParams(sp).toString();
  const target = qs ? `/${slug}?${qs}` : `/${slug}`;

  permanentRedirect(target);
}
