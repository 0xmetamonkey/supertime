FROM node:20-alpine

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev --ignore-scripts socket.io

# Copy server code
COPY server/ ./server/

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "server/roulette-server.js"]
