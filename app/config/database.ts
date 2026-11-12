import "server-only";
import { createClient, type Client } from "@libsql/client/web";

let client: Client | null = null;

export function getDb(): Client {
    if (client) return client;

    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        throw new Error(
            "Turso database credentials are missing"
        );
    }

    client = createClient({
        url,
        authToken,
    });

    return client;
}
