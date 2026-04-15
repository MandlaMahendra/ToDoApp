# Use Node.js 18 alpine for a small image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install only production dependencies
# Using npm ci ensures a clean install based on the lockfile
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the API port
EXPOSE 5000

# Use a non-root user for security
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp \
    && chown -R nodeapp:nodeapp /app
USER nodeapp

# Start the application
CMD ["node", "server.js"]
