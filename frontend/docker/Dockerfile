FROM node:22-alpine

WORKDIR /app

COPY frontend/package*.json /app/frontend/
RUN cd /app/frontend && npm ci

COPY frontend/ /app/frontend/

EXPOSE 3000

CMD ["sh", "-c", "cd /app/frontend && npm run dev -- --hostname 0.0.0.0 --port 3000"]

