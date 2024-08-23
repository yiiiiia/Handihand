FROM node:22.6.0-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and yarn.lock files
COPY package.json yarn.lock ./

# Install dependencies with Yarn
RUN yarn install

# Copy the rest of the application code
COPY . .

# Ensure the user running the app has proper permissions
RUN chown -R node:node /app

# Switch to a non-root user
USER node

RUN yarn prisma generate

# Build the Next.js application
RUN yarn build

ENV NODE_ENV=production

# Expose the port that the app will run on
EXPOSE 3000

# Define the command to run your app
CMD ["yarn", "run", "start"]
