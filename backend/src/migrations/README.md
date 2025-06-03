# User Type Unification Migration

This directory contains migration scripts for the user type unification feature.

## Overview

The application has been updated to unify user types (COMPRADOR, PRESTADOR, ANUNCIANTE) by replacing the single `tipoUsuario` enum field with boolean capability flags. This allows users to have multiple roles simultaneously.

## Changes Made

1. **User Model**:
   - Replaced `tipoUsuario` enum field with boolean flags:
     - `isComprador`
     - `isPrestador`
     - `isAnunciante`
     - `isAdmin`
   - Updated the User interface to extend IUserCapabilities

2. **Authentication**:
   - Updated JWT payload to include the new boolean fields
   - Modified token validation to check for boolean fields

3. **Authorization**:
   - Redesigned middleware to check for specific capabilities instead of user types
   - Updated controllers to use the new capability checks

4. **Migration**:
   - Created a migration script to update existing users in the database

## Running the Migration

Before deploying the updated code to production, you need to run the migration script to update existing users in the database. The migration will:

1. Find all existing users
2. Set the appropriate boolean flags based on their current `tipoUsuario` value
3. Update the users in the database

To run the migration:

```bash
# From the backend directory
pnpm run migrate:user-types
```

## Verification

After running the migration, you should verify that:

1. Existing users can still log in
2. Users retain their original capabilities
3. The application functions correctly with the new user model

## Rollback Plan

If issues are encountered, the following rollback steps can be taken:

1. Revert the code changes
2. Restore the database from a backup taken before the migration