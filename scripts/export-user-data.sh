#!/bin/bash

# Export user data from development database
# This exports users, sessions, and audit_logs tables

echo "Exporting user data from development database..."

# Export each table's data (excluding schema since that's already on production)
docker exec postgres pg_dump -U tmeuser -d tmeportal \
  --data-only \
  --table=users \
  --table=sessions \
  --table=audit_logs \
  > database/user_data_export.sql

echo "User data exported to database/user_data_export.sql"