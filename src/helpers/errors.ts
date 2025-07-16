export class MissingEnvVariableError extends Error {
  constructor(envName: string) {
    super(`Missing environment variable ${envName}`);
  }
}

export class InvalidEnvVariableError extends Error {
  constructor(envName: string) {
    super(`Invalid environment variable ${envName}`);
  }
}
