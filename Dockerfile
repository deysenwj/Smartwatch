# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Accept build arguments from docker-compose
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_RESEND_API_KEY
ARG VITE_RESEND_FROM_EMAIL

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build the application (creates dist directory)
RUN npm run build

# Create a static env.js file in the dist directory with the build arguments
RUN echo "window.env = { \\n  VITE_SUPABASE_URL: \"$VITE_SUPABASE_URL\", \\n  VITE_SUPABASE_ANON_KEY: \"$VITE_SUPABASE_ANON_KEY\", \\n  VITE_RESEND_API_KEY: \"$VITE_RESEND_API_KEY\", \\n  VITE_RESEND_FROM_EMAIL: \"$VITE_RESEND_FROM_EMAIL\"\\n};" > ./dist/env.js

# Production stage
FROM nginx:alpine

# Custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
