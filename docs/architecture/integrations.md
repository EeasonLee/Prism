# Integrations

## System Landscape

This project is part of a cross-border ecommerce rebuild spanning multiple systems:

- Magento handles core commerce facts such as catalog, cart, inventory, checkout, and order workflows
- Strapi handles content and merchandising configuration such as product enrichment, blogs, recipes, SEO, and discovery-related content
- SSO acts as the authentication aggregation layer and Magento-facing proxy
- Next.js in `D:\WORK\prism` renders the frontend experience and increasingly acts as the page-level aggregation layer

## Data Flow

- Product data: Magento via SSO plus Strapi content are merged in the frontend-facing product layer
- Content data: Strapi feeds blogs, recipes, SEO, and rich product content into Next.js
- Authentication: SSO provides login state coordination and Magento session bridging
- Checkout: Next.js hands off to Magento checkout flows

## Key Integration Areas

- Unified product aggregation
- Strapi product enrichment by SKU
- Discovery/category mapping and filter configuration
- Authentication/session synchronization through SSO

## Related References

- `docs/project-plan.md`
- `docs/claude-workflows.md`
