FROM oven/bun:1-alpine
WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile

EXPOSE 3000

CMD ["bun", "server.ts"]
