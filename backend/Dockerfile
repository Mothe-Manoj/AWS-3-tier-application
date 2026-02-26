# Stage 1: Build & Dependencies
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Use npm install to handle the lockfile sync issue you had
# --omit=dev keeps the final image small by excluding testing tools
RUN npm install --omit=dev

# Copy the rest of your backend code (server.js, etc.)
COPY . .

# Stage 2: Production Runner
FROM node:22-alpine

WORKDIR /app

# Copy only the production-ready code and modules from the builder
COPY --from=builder /app /app

# Expose port 5001 (matching your server.js)
EXPOSE 5001

# Start the server
CMD ["node", "server.js"]
