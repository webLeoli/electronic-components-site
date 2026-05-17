# Image Asset Management Plan

This plan covers blog images, product images, category/manufacturer media, and future asset growth for FPGACenter.

## Current State

Current project facts:

- `Product.imageUrl` is a string field.
- `BlogPost.coverImage` is a string field.
- Blog inline images are embedded in `BlogPost.content` as HTML/Markdown paths.
- Uploaded public files go to `public/uploads/...`.
- `public/uploads/` is ignored by Git and is not included in the safe data package.
- Existing committed `public` images are about 30 MB across 45 files.
- The current upload routes validate MIME type, extension, magic bytes, and max size.
- No image compression, dimension normalization, duplicate detection, media library, or orphan cleanup exists yet.

Current limits:

| Area | Current Limit | Notes |
|---|---:|---|
| Product/category upload | 5 MB | `/api/admin/upload` |
| Blog image/video upload | 10 MB | `/api/admin/blog/upload` |
| Next image config | AVIF/WebP enabled | But product rendering uses raw `<img>` for arbitrary URLs |

## Main Problems

1. **Uploads are not part of Git or the safe data package**

   This is correct for large media, but it means a data sync only moves image URLs, not the actual files. The media files need their own backup/sync path.

2. **`public/uploads` can grow without control**

   Re-uploaded blog images, unused cover images, deleted products, and test uploads will remain on disk unless we add cleanup tooling.

3. **No canonical asset record**

   There is no `Asset` table, so the system cannot answer: who owns this file, is it used, what size is it, when can it be deleted?

4. **Product image scale is dangerous**

   For 719K products, one 80 KB optimized image per product is about 57 GB. With source files plus variants, this can easily become 120-180 GB. Product images must be staged, not bulk-added blindly.

5. **Blog uploads allow video**

   Video in blog content can quickly dominate storage and page weight. It should be disabled or moved to external/object storage before serious content production.

6. **No generated variants**

   The same uploaded file is used for all contexts. A blog cover, product card thumbnail, product detail image, and social preview should not all serve the same full-size file.

## Asset Classes

| Class | Examples | Storage | Git? | Data Package? |
|---|---|---|---|---|
| Core UI/static | logo, icons, package placeholders | `public/` | Yes | No |
| Blog media | cover images, inline diagrams | `public/uploads/blog/` short term, object storage later | No | URL only |
| Product media | product photos, package photos | `public/uploads/products/` short term, object storage later | No | URL only |
| Category media | category thumbnails/hero images | `public/categories/` if curated, otherwise uploads | Usually yes for curated | URL only if uploaded |
| Manufacturer logos | official logos | `public/uploads/manufacturers/` or object storage | No unless tiny curated set | URL only |
| RFQ/BOM files | customer uploaded BOMs | `data/bom-uploads/` private | No | No |

## Short-Term Policy

Use the current simple system, but with stricter rules.

### Blog Images

- Cover image target: `1600x900`, WebP preferred.
- Cover image max after optimization: `250 KB`.
- Inline image target width: `900-1200 px`.
- Inline image max after optimization: `180 KB`.
- Avoid GIFs except tiny diagrams. Do not use animated GIF for real content.
- Disable blog video upload before publishing video-heavy content, or store video externally.
- Filename pattern:

```text
/uploads/blog/YYYY/MM/<slug>-cover.webp
/uploads/blog/YYYY/MM/<slug>-diagram-01.webp
```

### Product Images

- Do not try to image all 719K products.
- Start only with:
  - top RFQ products,
  - top indexed products,
  - high-value FPGA/CPLD/obsolete pages,
  - pages already receiving impressions/clicks.
- Product source max: `1200x1200`.
- Product detail variant: `800x800`, target `80-140 KB`.
- Product card variant: `320x320`, target `20-50 KB`.
- Thumbnail variant: `96x96`, target `<15 KB`.
- Filename pattern:

```text
/uploads/products/<manufacturer-slug>/<part-number-normalized>-800.webp
/uploads/products/<manufacturer-slug>/<part-number-normalized>-320.webp
/uploads/products/<manufacturer-slug>/<part-number-normalized>-96.webp
```

### Category And Manufacturer Images

- Category curated images can stay in Git if stable and few.
- Manufacturer logos should not be added in bulk until licensing/source is confirmed.
- Logo max: `400x160`, WebP/PNG, target `<40 KB`.
- Category image max: `1200x900`, target `<200 KB`.

## Medium-Term Architecture

Add an asset table before scaling media.

Suggested model:

```prisma
model Asset {
  id           Int      @id @default(autoincrement())
  url          String   @unique
  storageKey   String   @unique
  type         String   // blog, product, category, manufacturer
  mimeType     String
  width        Int?
  height       Int?
  sizeBytes    Int
  checksum     String
  altText      String?
  source       String?  // upload, generated, external, supplier
  ownerType    String?  // Product, BlogPost, Category, Manufacturer
  ownerKey     String?  // partNumber, slug, etc.
  variants     String?  // JSON map: { thumb, card, detail, original }
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([type])
  @@index([ownerType, ownerKey])
  @@index([checksum])
}
```

Use the `Asset` table to:

- prevent duplicates by checksum,
- list orphan files,
- generate image XML sitemap later,
- back up only referenced media,
- enforce storage budgets.

## Long-Term Storage

For a small number of images, server disk is acceptable. For product-scale images, use object storage.

Recommended long-term setup:

- Cloudflare R2 or S3-compatible storage for originals and variants.
- CDN in front of object storage.
- Database stores only canonical URLs and asset metadata.
- App server does not need to carry gigabytes of images.
- Deployments do not risk deleting media.

## Data Sync Rules

Data sync should move references, not media blobs:

- Safe data package includes `Product.imageUrl` and `BlogPost.coverImage`.
- Safe data package does not include files under `public/uploads`.
- Media files need separate sync:

```bash
rsync -avz /local/uploads/ root@SERVER:/opt/fpgacenter/public/uploads/
```

or object storage sync:

```bash
rclone sync local-media/ r2:fpgacenter-media/
```

When importing a data package, verify missing media:

```text
For every Product.imageUrl or BlogPost.coverImage that starts with /uploads/,
check that the file exists on the server.
```

## Backup Policy

Back up these separately:

- database safe data package,
- `public/uploads/`,
- `data/bom-uploads/` private RFQ files.

Do not put these in Git.

Suggested server backup layout:

```text
/opt/backups/fpgacenter/db/
/opt/backups/fpgacenter/uploads/
/opt/backups/fpgacenter/bom-uploads/
```

Retention:

- daily uploads snapshot: 7 days,
- weekly uploads snapshot: 8 weeks,
- monthly uploads snapshot: 6 months.

## Cleanup Policy

Add an audit script before aggressive deletion.

The audit should:

1. Scan `public/uploads`.
2. Read references from:
   - `Product.imageUrl`,
   - `BlogPost.coverImage`,
   - `BlogPost.content`,
   - `Category.icon` if it stores upload paths,
   - `Manufacturer.logo`.
3. Report:
   - referenced files,
   - missing files,
   - orphan files,
   - files above size limit,
   - duplicate checksums.
4. Only delete with an explicit `--delete` flag.

Deletion rule:

- Do not delete files uploaded in the last 30 days.
- Do not delete files referenced anywhere.
- Move to quarantine first:

```text
public/uploads/.trash/YYYYMMDD/
```

Then permanently delete after 30 days.

## Page Weight Budgets

| Page Type | Image Budget |
|---|---:|
| Blog article initial viewport | <= 300 KB |
| Blog article total images | <= 1.2 MB |
| Product detail page | <= 200 KB image payload |
| Product listing page | <= 500 KB total images |
| Category landing page | <= 500 KB total images |

If a page exceeds budget, prefer:

- smaller variants,
- lazy loading,
- fewer inline images,
- diagrams instead of photos where appropriate,
- one strong cover image instead of multiple decoration images.

## Implementation Roadmap

### Phase 1: Rules And Audit

- Keep current upload routes.
- Add image size/dimension documentation to admin UI.
- Add upload audit script.
- Add missing-file report.
- Block blog video upload or lower it to an explicit separate flow.

### Phase 2: Compression And Variants

- Add server-side image processing with `sharp`.
- Convert JPEG/PNG uploads to WebP.
- Generate variants:
  - blog cover,
  - blog inline,
  - product detail,
  - product card,
  - thumbnail.
- Store original only when needed.

### Phase 3: Asset Table

- Add `Asset` table.
- Backfill existing `public/uploads`.
- Link assets to products/blog/category/manufacturer records.
- Add admin media library.

### Phase 4: Object Storage

- Move `public/uploads` to R2/S3.
- Add CDN domain, for example:

```text
https://media.fpgacenter.com/
```

- Update upload routes to write to object storage.
- Keep database fields as public URLs.

## Immediate Decisions

Recommended now:

1. Keep blog/product image URLs as they are.
2. Do not import product images in bulk.
3. Use generated product illustrations for most products.
4. Add real product images only for priority SKUs.
5. Treat uploaded media as separate from data packages.
6. Before adding hundreds of images, implement audit + compression.

