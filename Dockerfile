FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js server.json README.md LICENSE llms-install.md ./
CMD ["node", "server.js"]
