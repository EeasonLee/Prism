# Image Architecture

## Scope

This document describes how images are sourced, transformed, and rendered in the `prism` frontend. It focuses on the current shared image path, the Next.js optimization policy, and the known carousel follow-up issue that still needs separate debugging.

## Image Source Types

The project currently has three image source categories:

1. Static assets under `apps/prism/public/images`
2. CMS images returned by Strapi as relative paths like `/uploads/...`
3. Absolute remote images, mainly the production CloudFront domain

These source types should not all be treated the same. Static assets are already local to the app. CMS and CDN images go through the shared image utility layer first.

## Shared Image Flow

The main shared path is:

1. Call `processImageUrl` from `libs/shared/src/utils/image.ts`
2. Resolve relative Strapi paths against `NEXT_PUBLIC_IMAGE_BASE_URL`
3. Render through `OptimizedImage` in `libs/ui/src/components/OptimizedImage.tsx`
4. Let `OptimizedImage` decide whether `next/image` should use `unoptimized`

This is now the single source of truth for dynamic image URL handling. The old duplicate helper at `apps/prism/lib/utils/image.ts` was removed to avoid divergence.

## URL Resolution Rules

`processImageUrl` applies these rules:

1. If the value is already an absolute `http://` or `https://` URL, return it as-is
2. If the value is a relative path, prepend `NEXT_PUBLIC_IMAGE_BASE_URL`
3. If `NEXT_PUBLIC_IMAGE_BASE_URL` is unset, fall back by environment:
   - development: `http://localhost:1337`
   - production: `https://d2s2mafqv46idp.cloudfront.net/joydeem/media/pages`

This keeps API payloads environment-agnostic while still producing browser-usable URLs.

## Optimization Policy

`OptimizedImage` keeps `next/image` as the shared renderer, but optimization is not always delegated to Next.

Current policy in `libs/shared/src/utils/image.ts`:

1. Private development hosts like `localhost` and RFC1918 HTTP addresses remain eligible for Next optimization
2. Non-private remote images are marked `unoptimized`

The reason for this split is practical:

1. CDN images are already compressed, resized, and cached upstream
2. Passing those same URLs through `/_next/image` adds another proxy hop
3. That proxy layer can generate multiple width variants and extra traffic with limited benefit

## Remote Host Allowlist

`apps/prism/next.config.js` now uses explicit `images.remotePatterns` instead of a blanket `https` wildcard.

Allowed sources are:

1. `images.unsplash.com`
2. known local Strapi hosts on port `1337`
3. the production CloudFront host
4. the host derived from `NEXT_PUBLIC_IMAGE_BASE_URL`

This is stricter than the prior config and matches the actual deployment model better.

## Carousel Policy

`apps/prism/app/components/HeroCarousel.tsx` now uses `OptimizedImage` with `forceUnoptimized`.

Reason:

1. Carousel slides use full-width visuals
2. For already-optimized remote sources, `next/image` width-variant generation is usually counterproductive here
3. The carousel should avoid triggering `/_next/image?...` bursts for the same source image

The current reviewed carousel changes keep:

1. stable Embla event subscription cleanup
2. memoized autoplay plugin creation
3. stable slide keys
4. `forceUnoptimized` for carousel slide images

The reviewed carousel changes intentionally do not keep aggressive client-side preloading of every slide image or `loading="eager"` for all slides. Those behaviors increase initial network cost and should only be added if measurement shows they are necessary.

## Known Good Direction

The current image strategy should be:

1. Use `OptimizedImage` as the shared component for dynamic images
2. Let shared utility code resolve relative URLs
3. Skip Next optimization for remote CDN-style assets that are already optimized upstream
4. Keep Next optimization available for local development media when useful
5. Avoid duplicating image helpers in app-local folders

## Known Follow-up Issue

A separate issue remains for the Blog and Recipes carousel:

- after `/_next/image?...` was removed, slide switching could still produce image network activity from the source URL itself

This follow-up is not fully solved in the current commit because the likely root cause is no longer the frontend optimization path alone.

The main remaining hypotheses are:

1. the image origin at `localhost:1337` is returning weak cache headers
2. browser cache revalidation is occurring even though the frontend no longer proxies through Next
3. looped carousel behavior may amplify visibility of cache misses, but is less likely to be the primary cause after the current cleanup

## Recommended Debug Path For The Follow-up

When resuming carousel debugging, check in this order:

1. capture response headers for a real carousel image URL
2. verify `Cache-Control`, `ETag`, and `Last-Modified`
3. confirm whether the request is a full transfer or a cache revalidation
4. only then decide whether to adjust Strapi/static serving or frontend loading behavior

## Files To Read First

If this area needs more changes later, start from:

1. `libs/shared/src/utils/image.ts`
2. `libs/ui/src/components/OptimizedImage.tsx`
3. `apps/prism/next.config.js`
4. `apps/prism/app/components/HeroCarousel.tsx`
5. `apps/prism/app/blog/page.tsx`
6. `apps/prism/app/recipes/RecipesClient.tsx`
