# API Tests

This directory contains tests for the API service functions.

## Test Files

### 1. api.auth.test.ts

This file includes comprehensive tests for all authentication functions:

- **login function**
   - Tests successful login with valid credentials
   - Tests error handling for invalid credentials
   - Tests error handling for network issues

- **register function**
   - Tests successful registration with valid data
   - Tests error handling for invalid registration data

- **getProfile function**
   - Tests successful profile retrieval with valid token
   - Tests error handling for invalid token

- **updateProfile function**
   - Tests successful profile update with valid data
   - Tests error handling for invalid update data

- **deleteAccount function**
   - Tests successful account deletion
   - Tests error handling for unauthorized deletion

### 2. api.data.test.ts

This file includes tests for data manipulation functions, organized by category:

- **Training Functions**
   - fetchTrainings
   - fetchTrainingDetail
   - createTraining

- **Offer Functions**
   - fetchAuthenticatedOffers
   - fetchPublicOffers
   - fetchMyOffers
   - createOffer
   - updateOffer
   - deleteOffer

- **Contratacao Functions**
   - hireOffer
   - fetchReceivedContratacoes
   - fetchMyHiredContratacoes

- **Payment and Review Functions**
   - processPayment
   - submitReview

- **Curriculo Functions**
   - saveCurriculo

- **Agenda Functions**
   - fetchAgenda
   - updateCompromissoStatus

- **Publicacao Functions**
   - fetchPublicacoes
   - createPublicacao

- **Notificacao Functions**
   - fetchNotificacoes
   - markNotificacaoAsRead
   - deleteNotificacao

- **Negociacao Functions**
   - iniciarNegociacao
   - responderNegociacao
   - confirmarNegociacao
   - fetchNegociacaoByContratacaoId

- **Relatorio Functions**
   - fetchRelatorio

## Running the Tests

To run these tests, use the following command:

```bash
pnpm test
```

Or to run tests once without watching for changes:

```bash
pnpm test -- --watchAll=false
```

## Test Implementation Details

- All tests follow the Arrange-Act-Assert pattern
- API calls are mocked to avoid making actual network requests
- Each test verifies both the function parameters and return values
- Error scenarios are thoroughly tested

## Known Issues and Troubleshooting

1. **Connectivity Check**: The login function performs a connectivity check that may cause issues in tests. This check is skipped in test environments.

2. **Mock Configuration**: Ensure that both axios and fetch are properly mocked:
   ```javascript
   // Mock axios
   jest.mock('axios');
   const mockedAxios = axios as jest.Mocked<typeof axios>;

   // Mock fetch
   global.fetch = jest.fn();
   const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>;

   // In beforeEach, mock the connectivity check
   beforeEach(() => {
     jest.clearAllMocks();
     mockedAxios.head.mockResolvedValue({
       status: 200,
       statusText: 'OK',
       headers: {},
       data: {}
     });
   });
   ```

3. **API_URL Configuration**: The API_URL is configured to use a test URL in test environments:
   ```javascript
   // In config/api.ts
   export const API_URL = 
     process.env.NODE_ENV === 'test' 
       ? 'http://test-api-url/api'
       : (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.8:3000/api');
   ```

## Future Improvements

- Add more edge cases and error scenarios
- Test with different user types (provider, buyer, etc.)
- Add integration tests that test the actual API endpoints
- Improve test environment setup to handle complex API interactions
- Add tests for additional functions as they are added to the API service
