FROM node:22-alpine

WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the application
COPY . .

# Next.js dev server runs on 3000 by default
EXPOSE 3000

# Start the dev server
CMD ["npm", "run", "dev"]
