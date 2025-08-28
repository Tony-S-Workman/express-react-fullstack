# Server Testing Guide

This document provides comprehensive information about the unit tests and integration tests for the Express React fullstack application server.

## Test Structure

The test suite is organized in the `src/server/__tests__/` directory with the following structure:

```
src/server/__tests__/
├── config.test.js          # Configuration module tests
├── connect-db.test.js      # Database connection tests
├── communicate-db.test.js  # Database operations tests
├── utility.test.js         # Utility functions tests
├── authenticate.test.js    # Authentication module tests
└── server.test.js          # Server integration tests
```

## Running Tests

### Available Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only server tests
npm run test:server
```

### Test Output

Tests provide detailed output including:
- Test results and pass/fail status
- Coverage reports (when using `--coverage`)
- Detailed error messages for failed tests
- Test execution time

## Test Categories

### 1. Configuration Tests (`config.test.js`)

Tests the environment configuration management system.

**Coverage:**
- Environment file loading
- Default value handling
- Type conversion (strings to numbers/booleans)
- Configuration validation
- Production security checks

**Key Test Cases:**
- Loading environment-specific files
- Fallback to default values
- Production environment validation
- Type conversion accuracy
- Error handling for missing files

### 2. Database Connection Tests (`connect-db.test.js`)

Tests the MongoDB connection management.

**Coverage:**
- Database connection establishment
- Connection reuse and caching
- Error handling
- Connection options

**Key Test Cases:**
- Successful database connections
- Connection reuse on multiple calls
- Error handling for connection failures
- MongoDB connection options
- Connection state management

### 3. Database Communication Tests (`communicate-db.test.js`)

Tests the database operations for tasks and comments.

**Coverage:**
- Task creation and updates
- Database operation error handling
- Data validation
- Edge cases

**Key Test Cases:**
- Creating new tasks
- Updating task properties
- Handling undefined/null values
- Database operation errors
- Special characters in data

### 4. Utility Tests (`utility.test.js`)

Tests the utility functions for assembling user state.

**Coverage:**
- User state assembly
- Database queries
- Data relationships
- Error handling

**Key Test Cases:**
- Complete user state assembly
- Empty data handling
- Database query errors
- Data relationship mapping
- Edge cases with null/undefined data

### 5. Authentication Tests (`authenticate.test.js`)

Tests the authentication and user management system.

**Coverage:**
- User authentication
- User creation
- Password hashing
- Token generation
- Error handling

**Key Test Cases:**
- Successful user authentication
- User creation with default group
- Password validation
- Duplicate user handling
- Authentication token management
- Error scenarios

### 6. Server Integration Tests (`server.test.js`)

Tests the Express server setup and API endpoints.

**Coverage:**
- Server configuration
- API endpoint functionality
- Middleware setup
- Error handling
- Production mode behavior

**Key Test Cases:**
- CORS configuration
- Body parsing middleware
- API endpoint responses
- Error handling for malformed requests
- Production static file serving

## Test Patterns and Best Practices

### Mocking Strategy

The tests use comprehensive mocking to isolate units under test:

```javascript
// Example: Mocking database connection
jest.mock('../connect-db', () => ({
  connectDB: jest.fn()
}));

// Example: Mocking external dependencies
jest.mock('md5', () => jest.fn());
jest.mock('uuid', () => ({
  __esModule: true,
  default: jest.fn()
}));
```

### Test Organization

Each test file follows a consistent structure:

1. **Setup and Mocking** - Configure mocks and test data
2. **Test Groups** - Organize tests by functionality
3. **Edge Cases** - Test boundary conditions and error scenarios
4. **Cleanup** - Reset mocks and state between tests

### Assertion Patterns

Tests use descriptive assertions with clear expectations:

```javascript
// Example: Testing function calls
expect(mockFunction).toHaveBeenCalledWith(expectedArgs);

// Example: Testing return values
expect(result).toEqual(expectedValue);

// Example: Testing error conditions
await expect(asyncFunction()).rejects.toThrow('Expected error');
```

## Coverage Requirements

The test suite maintains high coverage standards:

- **Branches**: 80% minimum
- **Functions**: 80% minimum  
- **Lines**: 80% minimum
- **Statements**: 80% minimum

### Coverage Reports

Generate coverage reports using:

```bash
npm run test:coverage
```

This generates:
- Console coverage summary
- HTML coverage report in `coverage/` directory
- LCOV format for CI/CD integration

## Continuous Integration

### GitHub Actions Integration

The test suite is designed to work with CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm test

- name: Generate Coverage Report
  run: npm run test:coverage
```

### Pre-commit Hooks

Consider adding pre-commit hooks to ensure tests pass before commits:

```bash
# Example pre-commit hook
npm test && npm run test:coverage
```

## Debugging Tests

### Common Issues

1. **Mock Not Working**: Ensure mocks are defined before imports
2. **Async Test Failures**: Use proper async/await patterns
3. **Database Connection Issues**: Verify mock setup for database tests

### Debug Commands

```bash
# Run specific test file
npm test -- config.test.js

# Run tests with verbose output
npm test -- --verbose

# Run tests in debug mode
npm test -- --detectOpenHandles
```

## Adding New Tests

### Test File Structure

When adding new tests, follow this template:

```javascript
import { functionToTest } from '../module-to-test';

// Mock dependencies
jest.mock('../dependency', () => ({
  dependencyFunction: jest.fn()
}));

describe('Module Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Function Name', () => {
    it('should do something specific', async () => {
      // Arrange
      const input = 'test data';
      
      // Act
      const result = await functionToTest(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

### Test Naming Conventions

- Use descriptive test names that explain the scenario
- Group related tests using `describe` blocks
- Use consistent naming patterns across test files

### Test Data Management

- Create reusable test data fixtures
- Use `beforeEach` to reset test state
- Mock external dependencies consistently

## Performance Considerations

### Test Execution Time

- Individual tests should complete in < 100ms
- Full test suite should complete in < 30 seconds
- Use `--maxWorkers` option for parallel execution

### Memory Usage

- Clean up mocks and test data between tests
- Avoid memory leaks in long-running test suites
- Monitor memory usage in CI environments

## Future Enhancements

### Planned Improvements

1. **E2E Testing**: Add end-to-end tests with real database
2. **Performance Testing**: Add load testing for API endpoints
3. **Security Testing**: Add security-focused test cases
4. **Visual Regression**: Add visual testing for UI components

### Test Infrastructure

1. **Test Database**: Set up dedicated test database
2. **Test Data Seeding**: Implement test data management
3. **Test Environment**: Create isolated test environment
4. **Monitoring**: Add test performance monitoring

## Troubleshooting

### Common Problems

1. **Tests Failing Intermittently**: Check for race conditions
2. **Mock Not Working**: Verify mock setup and timing
3. **Coverage Not Accurate**: Check file inclusion/exclusion patterns
4. **Slow Test Execution**: Optimize test setup and teardown

### Getting Help

- Check test output for detailed error messages
- Review mock setup and dependencies
- Verify test environment configuration
- Consult Jest documentation for advanced features
