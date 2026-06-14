This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```


### docker start:

## Development (hot-reload):


# First run — builds the image
docker compose up --build

# Subsequent runs
docker compose up

# In a separate terminal, add the studio profile
docker compose --profile studio up studio

## Production:

# Copy .env.example → .env.prod and fill in real credentials, then:
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
# or this with .env :
docker compose -f docker-compose.prod.yml up --build -d

# Prisma migrations (dev, if needed manually):


docker compose exec app npx prisma migrate dev --name your_migration_name


# run only db with docker :
docker compose -f docker-compose.db.yml up