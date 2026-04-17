import { createJiti } from 'jiti';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const jiti = createJiti(__filename, { alias: { '@/lib/env': join(__dirname, 'apps/prism/lib/env.ts') } });

// 设置环境变量
process.env.NODE_ENV = 'development';
process.env.NEXT_PUBLIC_MEILISEARCH_HOST = 'http://localhost:7700';
process.env.MEILISEARCH_API_KEY = '***';

async function main() {
  const { getProductListBFF } = await jiti(
    join(__dirname, 'apps/prism/lib/api/bff/product/list.ts')
  );
  const result = await getProductListBFF({ page: 1, limit: 5 });
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
