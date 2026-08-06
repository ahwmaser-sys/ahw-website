FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /workspace

FROM base AS dependencies
COPY package.json pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages
COPY services ./services
RUN pnpm install --frozen-lockfile=false

FROM dependencies AS validation
COPY . .
RUN pnpm check

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=dependencies /workspace /workspace
CMD ["pnpm", "check"]
