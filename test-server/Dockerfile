FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV FORCE_REBUILD="$(date +%s)"
RUN npm run build
CMD ["node", "dist/server.js"]