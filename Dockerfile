FROM node:20

WORKDIR /app

# Create logs directory
RUN mkdir -p /app/logs

# Set npm config to disable strict SSL
RUN npm config set strict-ssl false
RUN yarn config set strict-ssl false

# Inside the container
# Install global packages
# RUN npm config set strict-ssl false && \
    # npm install -g concurrently nodemon

# Copy and install API dependencies
# COPY package*.json ./
# RUN npm install --strict-ssl false

# Copy and install UI dependencies
# COPY src/ui/package*.json ./src/ui/
# RUN cd src/ui && npm install --strict-ssl false

# Copy source files
# COPY . .

# Build React app
# RUN cd src/ui && npm run build

EXPOSE 8080

CMD ["tail", "-f", "/dev/null"]


# CMD ["npm", "run", "dev:all"]