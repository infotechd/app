import swaggerJsdoc = require('swagger-jsdoc');
// Using a hardcoded version or environment variable instead of importing from package.json
const version = process.env.npm_package_version || '1.0.0';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Super App API Documentation',
      version,
      description: 'API documentation for the Super App backend services',
      contact: {
        name: 'Development Team',
        email: 'dev@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/models/*.ts',
    './src/controllers/*.ts',
    './src/schemas/*.ts'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
