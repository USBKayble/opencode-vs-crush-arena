FROM node:20-bookworm

ENV DEBIAN_FRONTEND=noninteractive
ENV GOBIN=/root/.local/bin
ENV PATH=$GOBIN:$PATH

RUN apt-get update && apt-get install -y \
    golang \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN chmod +x .github/arena/run-*.sh

ENTRYPOINT ["node", "task-runners/run-all-tasks.js"]
