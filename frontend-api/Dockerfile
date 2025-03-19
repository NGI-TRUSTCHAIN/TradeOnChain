# Use a node image as base
FROM node:20-alpine

# Set the working directory
WORKDIR /api

# Copying package.json
COPY package.json ./

# Install dependencies
RUN npm install

# Copying the rest of the application
COPY . .

# Set the environment variable
ENV NODE_ENV=docker

# Expose the port
EXPOSE 8085

# Command to run the application
CMD ["npm", "run", "start:docker"]