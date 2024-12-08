# Node.js Project Template

Modern Node.js project template with TypeScript and ESM support.

## Features

- [TypeScript](https://www.typescriptlang.org/) with ESM support
- [ESLint](https://eslint.org/) with modern config
- [Node.js Test Runner](https://nodejs.org/api/test.html) for testing
- [Pino](https://getpino.io/) for structured logging
- [Zod](https://zod.dev/) for runtime type validation
- [Docker](./Dockerfile) support
- GitHub Actions [CI workflow](.github/workflows/default.yml)

## Scripts

- `npm start` - Start the application
- `npm run dev` - Start development mode with watch
- `npm run build` - Build TypeScript to JavaScript
- `npm test` - Run tests
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Check TypeScript types

## Environment Variables

- `NODE_ENV` - Application environment (default: development)
- `SAMPLE_ENV_VAR` - Sample environment variable

## Docker

To build and run the Docker container for this application, follow these steps:

1. **Build the Docker image**:

   ```bash
   docker build -t my-app .
   ```

2. **Run the Docker container**:
   ```bash
   docker run -e NODE_ENV=production my-app
   ```

## License

MIT
