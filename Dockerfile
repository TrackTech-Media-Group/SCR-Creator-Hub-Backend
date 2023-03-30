FROM node:19-alpine as builder
WORKDIR /creatorhub

# Copy Existing Files
COPY package.json yarn.lock .yarnrc.yml tsconfig.json ./
COPY .yarn ./.yarn
COPY src ./src
COPY types ./types
COPY prisma ./prisma

# Install dependencies and build app
RUN yarn install --immutable
RUN yarn run prisma generate
RUN yarn build

FROM node:19-alpine as runner
RUN apk add --no-cache ffmpeg

WORKDIR /creatorhub

# Create user PaperPlane
RUN addgroup --system --gid 3951 creatorhub
RUN adduser --system --uid 3951 creatorhub

# Copy build files
COPY --from=builder --chown=creatorhub:creatorhub /creatorhub/dist ./dist
COPY --from=builder --chown=creatorhub:creatorhub /creatorhub/prisma ./prisma
COPY --from=builder --chown=creatorhub:creatorhub /creatorhub/node_modules ./node_modules
COPY --from=builder --chown=creatorhub:creatorhub /creatorhub/package.json ./package.json

# Create data folder
RUN mkdir /creatorhub/data
RUN chown -R creatorhub:creatorhub /creatorhub/data

USER creatorhub

# Run NodeJS script
CMD ["yarn", "run", "start"]