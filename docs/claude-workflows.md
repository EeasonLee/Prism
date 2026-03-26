# Claude Workflows

## Cross-Repo Task Template

Use this prompt when a task spans `D:\WORK\prism` and `D:\WORK\helpcenter\backend`:

```text
This is a cross-repo task.
Primary repo: D:\WORK\prism
Related repo: D:\WORK\helpcenter\backend

Work in this order:
1. Find the Prism entry point, consuming types, and UI surface
2. Find the matching Strapi content-type/controller/service/response
3. Align field names, nullability, slug/category/SKU mapping, and cache assumptions
4. Summarize impact by repo and contract changes
5. Implement the smallest correct fix
6. Verify both code paths that are affected
```

## When To Use

Use the cross-repo template for work involving product enrichment, discovery, SEO, recipes, blogs, category mapping, or any Strapi-driven frontend section.
