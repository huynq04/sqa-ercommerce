// Global Jest setup: mock guards that depend on CACHE_MANAGER/JwtService/Reflector
jest.mock('@modules/auth/auth.guard', () => ({
  AuthGuard: class {
    canActivate() {
      return true;
    }
  }
}));

jest.mock('@modules/auth/optional-auth.guard', () => ({
  OptionalAuthGuard: class {
    canActivate() {
      return true;
    }
  }
}));

// Additional common module mocks can be added here if needed
