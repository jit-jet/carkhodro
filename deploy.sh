#!/bin/bash

set -e

echo "Running migrations..."
npx prisma migrate deploy

echo "Generating Prisma Client..."
npx prisma generate

echo "Building..."
npm run build

echo "Restarting service..."
systemctl restart carkhodro

echo "Deployment complete."