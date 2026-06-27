FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build
RUN npx prisma generate

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate
COPY --from=builder /app/dist ./dist
RUN mkdir -p uploads
EXPOSE 3001
CMD ["node", "dist/index.js"]
