# Common Schemas Package

This package contains shared schemas and types for the Super App using [Zod](https://github.com/colinhacks/zod).

## Installation

This package is part of the monorepo and is automatically available to other packages in the workspace.

## Usage

### Importing Schemas

You can import schemas from the package:

```typescript
// Import specific schemas
import { userSchema, createUserSchema } from 'app-common';

// Or import from specific modules
import { offerSchema } from 'app-common/schemas/offer';
```

### Validating Data

```typescript
import { createUserSchema } from 'app-common';

// Validate user data
const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123'
};

const result = createUserSchema.safeParse(userData);

if (result.success) {
  // Data is valid
  const validatedData = result.data;
  // Use validatedData...
} else {
  // Data is invalid
  console.error(result.error.issues);
}
```

### Using Types

```typescript
import { User, CreateUser } from 'app-common';

// Use the types in your functions
function processUser(user: User) {
  // ...
}

function createNewUser(userData: CreateUser) {
  // ...
}
```

## Available Schemas

### User Schemas

- `userSchema`: Complete user schema
- `createUserSchema`: Schema for creating users
- `updateUserSchema`: Schema for updating users
- `loginUserSchema`: Schema for user login

### Offer Schemas

- `offerSchema`: Complete offer schema
- `createOfferSchema`: Schema for creating offers
- `updateOfferSchema`: Schema for updating offers
- `offerSearchSchema`: Schema for searching offers

### API Schemas

- `apiResponseSchema`: Schema for API responses
- `paginationParamsSchema`: Schema for pagination parameters
- `paginatedResponseSchema`: Schema for paginated responses
- `errorResponseSchema`: Schema for error responses

## Development

### Building

```bash
pnpm run build
```

### Testing

```bash
pnpm run test
```