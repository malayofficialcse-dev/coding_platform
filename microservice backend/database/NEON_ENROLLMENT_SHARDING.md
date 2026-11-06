# Neon Enrollment sharding and read routing

This implementation keeps Neon as the only database provider.

Use `ENROLLMENT_SHARD_COUNT=1` first. The existing `ENROLLMENT_DATABASE_URL` remains the fallback for the first shard, so the current production setup continues to work.

For every shard, configure a Neon primary URL and, when available in your Neon setup, a Neon read endpoint:

```text
ENROLLMENT_SHARD_0_WRITE_DATABASE_URL=...
ENROLLMENT_SHARD_0_READ_DATABASE_URL=...
```

Writes always go to the primary. Safe list reads use the read URL. Progress updates and certificate operations use the primary. The application does not create physical Neon replicas; Neon remains responsible for the underlying compute/storage replication.

Before enabling multiple shards:

1. Run both SQL migrations against the correct Neon schema.
2. Backfill `shardId` for existing rows.
3. Copy rows to the target shard using the same SHA-256 user hash used by `shardResolver.js`.
4. Verify counts and checksums.
5. Set `ENROLLMENT_SHARD_COUNT` and all shard URLs.
6. Check `/health/database`.
