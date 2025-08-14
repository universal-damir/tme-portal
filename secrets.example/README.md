# Secrets Directory Template

For production deployment, create a `secrets/` directory with these files:

## Required Files:

1. **postgres_password.txt** - PostgreSQL password
2. **redis_password.txt** - Redis password  
3. **nextauth_secret.txt** - NextAuth JWT secret

## Example Structure:
```
secrets/
├── postgres_password.txt
├── redis_password.txt
└── nextauth_secret.txt
```

## How to Create:
```bash
mkdir -p secrets
echo "your-postgres-password" > secrets/postgres_password.txt
echo "your-redis-password" > secrets/redis_password.txt
echo "your-nextauth-secret" > secrets/nextauth_secret.txt
chmod 600 secrets/*
```

**IMPORTANT**: Never commit the actual `secrets/` directory to Git!