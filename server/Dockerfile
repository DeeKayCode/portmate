FROM node:22-alpine AS build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/tsconfig.json server/eslint.config.js ./
COPY server/src ./src
COPY contracts /app/contracts
COPY server/migrations ./migrations
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/migrations ./migrations
EXPOSE 3000
CMD ["node", "dist/index.js"]
