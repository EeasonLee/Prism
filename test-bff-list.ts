import { getProductListBFF } from './apps/prism/lib/api/bff/product/list';

async function main() {
  const result = await getProductListBFF({ page: 1, limit: 5 });
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
