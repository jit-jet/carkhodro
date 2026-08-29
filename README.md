This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started


## run only db with docker :
docker compose -f docker-compose.db.yml up -d

# then run this in terminal
npx prisma migrate dev --name init   # CREATE DB TABLES AND SQL
npx prisma generate             # CREATE  PRISMA CLIENT
npx prisma db seed

# prisma studio
npx prisma studio


## build app
npm run  build



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