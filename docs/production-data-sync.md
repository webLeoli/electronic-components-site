# FPGACenter Production Data Sync

This project has two kinds of state:

- Code and tracked files: synced with Git.
- Database content: synced with a safe data package.

The safe data package includes public growth/content tables:

- categories
- manufacturers
- products
- blog categories
- blog posts
- allowed SEO/indexing admin settings

It never exports or imports RFQ submissions, contact submissions, admin users,
environment secrets, uploaded files, or build artifacts.

## Production to Local

Use this when the VPS has the newest real content and the local database should
match production.

On the VPS, create a package:

```bash
cd /opt/fpgacenter && npm run data:export -- --output=data-packages/production-content-sync && tar -czf /tmp/fpgacenter-production-content-sync.tar.gz -C data-packages production-content-sync
```

Download `/tmp/fpgacenter-production-content-sync.tar.gz` to the local project.

On local, extract it and validate first:

```bash
npm run data:import -- data-packages/production-content-sync
```

Then replace local public content tables with the package:

```bash
npm run data:import -- data-packages/production-content-sync --apply --replace
```

## Local to Production

Use this only after local content has been reviewed and should become the new
production content.

On local, export:

```bash
npm run data:export -- --output=data-packages/local-content-sync
```

Upload `data-packages/local-content-sync` to the VPS, then validate:

```bash
cd /opt/fpgacenter && npm run data:import -- data-packages/local-content-sync
```

Apply with replacement only after validation looks right:

```bash
cd /opt/fpgacenter && npm run data:import -- data-packages/local-content-sync --apply --replace
```

## Notes

The import script creates a backup before `--apply` unless `--no-backup` is set.
For production, keep the default backup behavior.

Use `--tables=categories,manufacturers,products` to sync only selected content
tables. By default, all safe content tables are synced.
