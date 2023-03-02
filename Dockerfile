FROM node:16.17-alpine as dev
WORKDIR /build
COPY package.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm install
RUN npm run build

FROM node:16.17-alpine
WORKDIR /bot
COPY package.json ./
RUN npm install --only=production
COPY --from=dev /build/dist .
COPY .env .
RUN npm install pm2 -g
ENV NODE_ENV production
EXPOSE 3000
CMD ["pm2-runtime", "server.js"]