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


## run only db with docker :
docker compose -f docker-compose.db.yml up

# then run this in terminal
npx prisma migrate dev --name init   # CREATE DB TABLES AND SQL
npx prisma generate             # CREATE  PRISMA CLIENT
npx prisma db seed

# prisma studio
npx prisma studio


# start project on server
pm2 start npm --name my-app -- start -- -p 80

# pm2 commands
# List processes
pm2 list

# View logs
pm2 logs my-app

# Restart app
pm2 restart my-app

# Stop app
pm2 stop my-app

# Delete app from PM2
pm2 delete my-app

# Save current processes
pm2 save

# Configure PM2 to start on server boot
pm2 startup