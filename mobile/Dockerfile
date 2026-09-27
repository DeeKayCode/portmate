FROM node:22-alpine AS build
WORKDIR /app/mobile
COPY mobile/package*.json ./
RUN npm ci
COPY mobile .
COPY contracts /app/contracts
RUN npm run build

FROM nginx:1.27-alpine
COPY mobile/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/mobile/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --retries=10 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
