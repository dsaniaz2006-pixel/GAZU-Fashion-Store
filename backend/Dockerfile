FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM node:22-alpine
ENV NODE_ENV=development
WORKDIR /app
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node src ./src
# One-time catalogue cleanup and the seed share the same three-demo source.
COPY --chown=node:node scripts ./scripts
RUN mkdir -p /app/data/uploads && chown -R node:node /app/data
USER node
EXPOSE 8000
CMD ["node", "src/server.js"]
