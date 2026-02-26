# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# 1. Use npm install instead of npm ci to handle lockfile sync issues
RUN npm install

# Copy the rest of the code
COPY . .

# 2. Build the static files
RUN npm run build 

# Stage 2: Production Runner
FROM node:22-alpine

WORKDIR /app

# 3. Only copy the final 'build' folder
COPY --from=builder /app /app

# 4. Install the lightweight server
RUN npm install -g serve

EXPOSE 3000

# 5. Serve the static folder
CMD ["serve", "-s", "build", "-l", "3000"]
