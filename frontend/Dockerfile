# Stage 1: Build the React Application
FROM node:18-alpine AS build

WORKDIR /app
# Copy the dependency list
COPY package*.json ./
# Install dependencies
RUN npm install
# Copy the rest of the application code
COPY . .
# Build the production bundle
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 (Internal to Docker network)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
