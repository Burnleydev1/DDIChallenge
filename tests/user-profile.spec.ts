import { test, expect } from '@playwright/test';
import { UserProfilePage } from '../pages/UserProfilePage';
import {
  validUser,
  validOptionalFields,
  invalidInputs,
  alertMessages,
} from './test-data';

test.describe('User Profile Form', () => {
  let profilePage: UserProfilePage;

  test.beforeEach(async ({ page }) => {
    profilePage = new UserProfilePage(page);
    await profilePage.goto();
  });

  test('TC-001: Submit with all mandatory fields filled correctly', async ({ page }) => {
    await profilePage.fillMandatoryFields();

    let dialogFired = false;
    page.once('dialog', async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });

    await Promise.all([
      page.waitForLoadState('load'),
      profilePage.submit(),
    ]);

    expect(dialogFired).toBe(false);
  });

  test('TC-002: Submit with all fields (mandatory + optional) completes without error', async ({ page }) => {
    await profilePage.fillMandatoryFields();
    await profilePage.fillOptionalFields(validOptionalFields);

    let dialogFired = false;
    page.once('dialog', async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });

    await Promise.all([
      page.waitForLoadState('load'),
      profilePage.submit(),
    ]);

    expect(dialogFired).toBe(false);
  });

  test('TC-003: Show error when first name is empty', async () => {
    await profilePage.fillMandatoryFields({ firstName: '' });
    const alert = await profilePage.submitAndGetAlert();
    expect(alert).toBe(alertMessages.firstNameRequired);
  });

  test('TC-004: Empty last name shows wrong error message', async () => {
    await profilePage.fillMandatoryFields({ lastName: '' });
    const alert = await profilePage.submitAndGetAlert();
    expect(alert).toBe(alertMessages.lastNameRequired);
  });

  test('TC-005: Show error when email is empty', async () => {
    await profilePage.fillMandatoryFields({ email: '' });
    const alert = await profilePage.submitAndGetAlert();
    expect(alert).toBe(alertMessages.emailRequired);
  });

  test('TC-006: Show error when confirm password is empty', async () => {
    await profilePage.fillMandatoryFields({ confirmPassword: '' });
    const alert = await profilePage.submitAndGetAlert();
    expect(alert).toBe(alertMessages.confirmPasswordRequired);
  });

  test('TC-007: Show error when passwords do not match', async () => {
    await profilePage.fillMandatoryFields({ confirmPassword: invalidInputs.mismatchedPassword });
    const alert = await profilePage.submitAndGetAlert();
    expect(alert).toBe(alertMessages.passwordsMismatch);
  });

  test('TC-008: Reject numeric characters in first name', async () => {
    await profilePage.fillMandatoryFields({ firstName: invalidInputs.firstNameWithNumbers });
    const alert = await profilePage.submitAndGetAlert();
    expect(alert).toBe(alertMessages.firstNameAlphaOnly);
  });

  test('TC-009: Reject special characters in last name', async () => {
    await profilePage.fillMandatoryFields({ lastName: invalidInputs.lastNameWithSpecialChars });
    const alert = await profilePage.submitAndGetAlert();
    expect(alert).toBe(alertMessages.lastNameAlphaOnly);
  });

  test('TC-010: Email field blocks submission when format is invalid', async ({ page }) => {
    await profilePage.firstNameInput.fill(validUser.firstName);
    await profilePage.lastNameInput.fill(validUser.lastName);
    await page.evaluate((email) => {
      (document.getElementById('email') as HTMLInputElement).value = email;
    }, invalidInputs.invalidEmail);
    await profilePage.passwordInput.fill(validUser.password);
    await profilePage.confirmPasswordInput.fill(validUser.confirmPassword);
    await profilePage.linkedinUrlInput.fill(validUser.linkedinUrl);

    const alert = await profilePage.submitAndGetAlert();
    expect(alert).toBe(alertMessages.emailInvalid);
  });

  test('TC-011: Password and confirm password fields must mask input', async () => {
    const passwordType = await profilePage.passwordInput.getAttribute('type');
    const confirmType = await profilePage.confirmPasswordInput.getAttribute('type');

    expect(passwordType).toBe('password');
    expect(confirmType).toBe('password');
  });

  test('TC-012: Phone field accepts exactly 10 digits and enforces the pattern', async () => {
    await profilePage.phoneNumberInput.fill(invalidInputs.phoneNumber);
    expect(await profilePage.phoneNumberInput.inputValue()).toBe(invalidInputs.phoneNumber);

    const pattern = await profilePage.phoneNumberInput.getAttribute('pattern');
    expect(pattern).toBe('[0-9]{10}');
  });

  test('TC-013: Date of birth accepts YYYY-MM-DD format', async () => {
    await profilePage.dateOfBirthInput.fill(invalidInputs.dateOfBirth);
    expect(await profilePage.dateOfBirthInput.inputValue()).toBe(invalidInputs.dateOfBirth);
  });

  test('TC-014: Phone field pattern error gives no format hint to user', async () => {
    const title = await profilePage.phoneNumberInput.getAttribute('title');
    expect(title).toBeTruthy();
    expect(title).toContain('10');
  });

  // ================================================================
  // ADDITIONAL BUGS (discovered during exploratory testing)
  // ================================================================

  test('BUG-006: First and last name fields reject names with spaces', async () => {
    await profilePage.fillMandatoryFields({ firstName: 'Mary Jane' });
    const alert = await profilePage.submitAndGetAlert();
    expect(alert).not.toBe(alertMessages.firstNameAlphaOnly);
  });

  test('BUG-007: Password validation accepts single-character passwords', async () => {
    await profilePage.fillMandatoryFields({ password: 'a', confirmPassword: 'a' });
    const alert = await profilePage.submitAndGetAlert();
    expect(alert).not.toBeNull();
  });

  test('BUG-008: LinkedIn field is mandatory despite being labelled optional', async ({ page }) => {
    await profilePage.firstNameInput.fill(validUser.firstName);
    await profilePage.lastNameInput.fill(validUser.lastName);
    await profilePage.emailInput.fill(validUser.email);
    await profilePage.passwordInput.fill(validUser.password);
    await profilePage.confirmPasswordInput.fill(validUser.confirmPassword);

    const alert = await profilePage.submitAndGetAlert();
    expect(alert).toBeNull();
  });
});
