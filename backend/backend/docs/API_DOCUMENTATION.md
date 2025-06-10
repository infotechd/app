# API Documentation

## Overview

This document provides information on how to access and use the API documentation for the Super App backend services.

## Accessing the API Documentation

The API documentation is available through Swagger UI, which provides an interactive interface to explore and test the API endpoints.

### URL

When the server is running, you can access the API documentation at:

```
http://localhost:3000/api-docs
```

> Note: The port may vary if the default port (3000) is already in use.

### Features

The Swagger UI provides the following features:

1. **Interactive Documentation**: Browse all available API endpoints, organized by tags.
2. **Request Builder**: Build and test API requests directly from the browser.
3. **Response Viewer**: View the responses from the API in a structured format.
4. **Authentication**: Test authenticated endpoints by providing a JWT token.
5. **Models**: View the data models used by the API.

## Authentication

Many API endpoints require authentication. To authenticate:

1. First, use the `/api/auth/login` endpoint to obtain a JWT token.
2. Click the "Authorize" button in the Swagger UI.
3. Enter your JWT token in the format: `Bearer your-token-here`.
4. Click "Authorize" to apply the token to all authenticated requests.

## API Endpoints

The API is organized into the following categories:

- **Ofertas**: Endpoints for managing service offers.
- **Contratações**: Endpoints for managing service contracts.
- **Comentários**: Endpoints for managing comments.
- **Curtidas**: Endpoints for managing likes.
- **Bloqueios de Agenda**: Endpoints for managing schedule blocks.
- **Currículos**: Endpoints for managing resumes.
- **Negociações**: Endpoints for managing negotiations.
- **Publicações na Comunidade**: Endpoints for managing community posts.
- **Notificações**: Endpoints for managing notifications.
- **Relatórios**: Endpoints for generating reports.
- **Treinamentos**: Endpoints for managing training.
- **Agenda**: Endpoints for managing schedules.
- **Upload**: Endpoints for uploading files.
- **Sistema**: System-related endpoints like health check.

## Raw OpenAPI Specification

If you need the raw OpenAPI specification in JSON format, it's available at:

```
http://localhost:3000/api-docs.json
```

This can be useful for generating client code or importing into other API tools.

## Adding Documentation to New Endpoints

When adding new endpoints to the API, follow these guidelines to ensure they are properly documented:

1. Use JSDoc comments with Swagger annotations above each route definition.
2. Define request parameters, body schema, and response schema.
3. Include examples for request and response.
4. Specify security requirements for authenticated endpoints.
5. Group related endpoints using tags.

Example:

```javascript
/**
 * @swagger
 * /resource:
 *   get:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [Category]
 *     parameters:
 *       - name: param
 *         in: query
 *         description: Parameter description
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 property:
 *                   type: string
 */
```

## Further Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger JSDoc Documentation](https://github.com/Surnet/swagger-jsdoc/blob/master/docs/GETTING-STARTED.md)
- [Swagger UI Express Documentation](https://github.com/scottie1984/swagger-ui-express)