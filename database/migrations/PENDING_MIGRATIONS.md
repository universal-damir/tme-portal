# Pending Production Migrations

## Applied to Test, Not Production

### 017_update_email_templates_plain_format.sql
- Type: SAFE (data-only change)
- Test Applied: PENDING
- Production Applied: ALREADY APPLIED (via direct SQL)
- Can deploy before code: YES
- Notes: Email template content updates - production already has these changes via direct UPDATE statements

## Migration Status

This migration formalizes the email template changes that were already applied directly to production.
The test database needs this migration to match production.

## Next Steps

1. Apply to test database to sync with production
2. No need to apply to production (already has the changes)