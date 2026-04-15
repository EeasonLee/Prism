import { categoryService } from '@/lib/services/category.service';
import { productService } from '@/lib/services/product.service';
import { env } from '@/lib/env';

export default async function TestGraphQLPage() {
  let categoryData = null;
  let categoryError = null;
  let productData = null;
  let productError = null;

  const graphqlUrl = env.NEXT_PUBLIC_MAGENTO_GRAPHQL_URL;

  try {
    categoryData = await categoryService.getCategoryTree({ rootId: 2 });
  } catch (error) {
    if (error instanceof Error) {
      categoryError = {
        message: error.message,
        name: error.name,
        cause: error.cause ? String(error.cause) : undefined,
        stack: error.stack,
      };
    } else {
      categoryError = String(error);
    }
  }

  try {
    productData = await productService.getProducts({ pageSize: 5 });
  } catch (error) {
    if (error instanceof Error) {
      productError = {
        message: error.message,
        name: error.name,
        cause: error.cause ? String(error.cause) : undefined,
        stack: error.stack,
      };
    } else {
      productError = String(error);
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '13px' }}>
      <h1>Magento GraphQL Test</h1>

      <section
        style={{
          marginTop: '1rem',
          background: '#f5f5f5',
          padding: '1rem',
          borderRadius: '4px',
        }}
      >
        <strong>GraphQL URL:</strong>{' '}
        <code>
          {graphqlUrl ?? '⚠️ NEXT_PUBLIC_MAGENTO_GRAPHQL_URL not set'}
        </code>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>
          <span role="img" aria-label="success">
            ✅
          </span>{' '}
          Category Tree
        </h2>
        {categoryError ? (
          <pre
            style={{
              color: 'red',
              background: '#fff0f0',
              padding: '1rem',
              borderRadius: '4px',
              overflowX: 'auto',
            }}
          >
            {JSON.stringify(categoryError, null, 2)}
          </pre>
        ) : (
          <pre
            style={{
              background: '#f0fff0',
              padding: '1rem',
              borderRadius: '4px',
              overflowX: 'auto',
            }}
          >
            {JSON.stringify(categoryData, null, 2)}
          </pre>
        )}
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>
          <span role="img" aria-label="success">
            ✅
          </span>{' '}
          Products (first 5)
        </h2>
        {productError ? (
          <pre
            style={{
              color: 'red',
              background: '#fff0f0',
              padding: '1rem',
              borderRadius: '4px',
              overflowX: 'auto',
            }}
          >
            {JSON.stringify(productError, null, 2)}
          </pre>
        ) : (
          <pre
            style={{
              background: '#f0fff0',
              padding: '1rem',
              borderRadius: '4px',
              overflowX: 'auto',
            }}
          >
            {JSON.stringify(productData, null, 2)}
          </pre>
        )}
      </section>
    </div>
  );
}
