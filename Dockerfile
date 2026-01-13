FROM node:20-alpine

LABEL maintainer="Joe Heyming <joeheyming@gmail.com>"
LABEL description="🌈 Nyan Cat ASCII animation server"

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application files
COPY index.js ./
COPY frames/ ./frames/
COPY original.mp3 ./

# Expose the default port
EXPOSE 3000

# Set environment variable
ENV NYAN_PORT=3000

# Run the server
CMD ["node", "index.js"]


