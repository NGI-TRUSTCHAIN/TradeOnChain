# Use a node image as base
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copying package.json
COPY package.json ./

# Install dependencies
RUN npm install

# Fix file ionicons.min.css
COPY public/assets/ionicons.min.css node_modules/onsenui/css/ionicons/css/ionicons.min.css

# Copying the rest of the application
COPY . .

# Set the environment variable
ENV NODE_ENV=docker

# Expose the port
EXPOSE 3001

# Command to run the application
CMD ["npm", "run", "start:docker"]