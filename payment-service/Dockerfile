FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
RUN mkdir -p /app/data/uploads && chown -R node:node /app/data
USER node
EXPOSE 4001
CMD ["npm", "start"]
