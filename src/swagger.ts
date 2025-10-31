import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import swaggerJSDoc from 'swagger-jsdoc';

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Parking API',
            version: '1.0.0',
            description: 'Parking API documentation',
        },
    },
    apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

const yamlPath = path.resolve('./src/docs/swagger.yaml');
if (fs.existsSync(yamlPath)) {
    const fileContent = fs.readFileSync(yamlPath, 'utf8');
    const yamlDoc = yaml.parse(fileContent);

    Object.assign(swaggerSpec, yamlDoc);
}

export { swaggerSpec };