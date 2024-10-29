# Starter

## Getting Started

### Database

1. Install [Turso CLI](https://docs.turso.tech/cli/installation):

```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
```

2. Create a database:

> [!NOTE]
> 
> You may also run Turbo locally with [`turso dev`](https://docs.turso.tech/local-development#turso-cli).

```bash
turso db create
```

Retrieve the connection URL and auth token from the CLI output. Set the environment variables as seen in [`.env.example`](./.env.example).

### Authentication

3. Create a GitHub OAuth app and set the environment variables as seen in [`.env.example`](./.env.example).

### Next.js

4. In package.json, update the dev script to a hostname and port of your choice, then run:

> [!NOTE]
>
> I recommend using a separate port for each project to avoid collisions with
> auth state, redirect caching etc etc.

```bash
sudo pnpm hostile set localhost $HOSTNAME
```

5. Run `pnpm dev` to start the development server.
