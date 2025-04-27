declare module 'bun' {
    interface Env {
        ACCOUNT_EMAIL: string;
        ACCOUNT_PASSWORD: string;
        PORT: string;
    }
}