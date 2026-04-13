/**
 * Centralised test data for the User Profile form test suite.
 * All test inputs and expected messages are defined here so they
 * can be reused across tests and updated in one place.
 */

export const validUser = {
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@example.com',
  password: 'P@ssw0rd123',
  confirmPassword: 'P@ssw0rd123',
  linkedinUrl: 'https://www.linkedin.com/in/johnsmith',
};

export const validOptionalFields = {
  gender: 'male' as const,
  dateOfBirth: '1990-01-15',
  phoneNumber: '1234567890',
  address: '123 Main St, Apt 1',
  githubUrl: 'https://github.com/johnsmith',
};

export const invalidInputs = {
  firstNameWithNumbers: 'John123',
  lastNameWithSpecialChars: 'Smith@',
  invalidEmail: 'john.smith.example.com',
  mismatchedPassword: 'WrongPass99',
  phoneNumber: '1234567890',
  dateOfBirth: '1990-06-15',
};

export const alertMessages = {
  firstNameRequired: 'First name must be filled out',
  lastNameRequired: 'Last name must be filled out',
  emailRequired: 'Email must be filled out',
  confirmPasswordRequired: 'Confirm password must be filled out',
  passwordsMismatch: 'Passwords do not match',
  firstNameAlphaOnly: 'First name must contain alphabetical characters only',
  lastNameAlphaOnly: 'Last name must contain alphabetical characters only',
  emailInvalid: 'Email must be a valid email address',
};
