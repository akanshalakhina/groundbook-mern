FROM node:22-slim
WORKDIR /app

# Only the libraries the app runs with: the test tools are devDependencies and stay out.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY seed ./seed

# 0.0.0.0, not 127.0.0.1: inside a container, 127.0.0.1 cannot be reached from the host.
ENV HOST=0.0.0.0 PORT=8080
EXPOSE 8080
CMD ["node", "src/server.js"]
