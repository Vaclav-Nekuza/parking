declare module 'swagger-jsdoc' {
    export interface SwaggerDefinition {
        openapi: string;
        info: {
            title: string;
            version: string;
            description?: string;
        };
        servers?: { url: string; description?: string }[];
    }

    export interface SwaggerOptions {
        definition: SwaggerDefinition;
        apis: string[];
    }

    export default function swaggerJSDoc(options: SwaggerOptions): Record<string, unknown>;
}