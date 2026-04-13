import { test, expect } from '@playwright/test';
import { UserProfilePage } from '../pages/UserProfilePage';
import {
  validUser,
  validOptionalFields,
  invalidInputs,
  alertMessages,
} from './test-data';

/*
 * Automated Test Suite — User Profile Creation Form
 * Target: https://qa-assessment.pages.dev/
 *
 * Key form behaviours discovered during testing:
 *  - Validation errors are delivered via JavaScript alert() dialogs.
 *  - On a successful submit the form performs a full page reload (GET to itself),
 *    so success is detected by waiting for navigation — not by looking for a DOM element.
 *  - The email field uses type="email", so the browser's native HTML5 validation
 *    fires before the JS regex check. TC-010 bypasses this via page.evaluate().
 */

test.describe('User Profile Form', () => {
  let profilePage: UserProfilePage;

  test.beforeEach(async ({ page }) => {
    profilePage = new UserProfilePage(page);
    await profilePage.goto();
  });

  // ================================================================
  // HAPPY PATH
  // ================================================================

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

  // ================================================================
  // MANDATORY FIELD VALIDATION
  // ================================================================

  test('TC-003: Show error when first name is empty', async () => {
    await profilePage.fillMandatoryFields({ firstName: '' });
    const alert = await profilePage.submitAndGetAlert();
    expect(alert).toBe(alertMessages.firstNameRequired);
  });

  test('TC-004: Empty last name shows wrong error message', async () => {
    // BUG-001: script.js line 22 shows "First name must be filled out" for an empty last name.
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

  // ================================================================
  // INPUT FORMAT VALIDATION
  // ================================================================

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
    // The email field uses type="email", so native HTML5 validation fires before the JS regex.
    // We use page.evaluate() to set the value directly, bypassing the native constraint,
    // so we can verify the JS validation layer is also working.
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

  // ================================================================
  // FIELD TYPE & UI CHECKS
  // ================================================================

  test('TC-011: Password and confirm password fields must mask input', async () => {
    // Both fields should use type="password" to hide characters as the user types.
    // BUG-002: confirm password currently uses type="text" — input is visible in plaintext.
    const passwordType = await profilePage.passwordInput.getAttribute('type');
    const confirmType = await profilePage.confirmPasswordInput.getAttribute('type');

    expect(passwordType).toBe('password');
    expect(confirmType).toBe('password'); // fails — BUG-002
  });

  test('TC-012: Phone field accepts exactly 10 digits and enforces the pattern', async () => {
    // Verify the field accepts a valid 10-digit number and that the HTML pattern attribute
    // is set correctly. Formats that violate the pattern should be blocked on submit.
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
    // BUG-004: pattern="[0-9]{10}" exists but no title attribute is set, so the browser
    // tooltip reads "Please match the requested format." with no hint about the expected format.
    const title = await profilePage.phoneNumberInput.getAttribute('title');
    expect(title).toBeTruthy(); // fails — BUG-004
    expect(title).toContain('10');
  });

  // ================================================================
  // ADDITIONAL BUGS (discovered during exploratory testing)
  // ================================================================

  test('BUG-006: First and last name fields reject names with spaces', async () => {
    // Users with compound names (e.g. "Mary Jane") cannot submit the form because
    // the alpha-only regex rejects spaces. The field should allow a single space.
    await profilePage.fillMandatoryFields({ firstName: 'Mary Jane' });
    const alert = await profilePage.submitAndGetAlert();
    // Should not block a name containing a single space
    expect(alert).not.toBe(alertMessages.firstNameAlphaOnly);
  });

  test('BUG-007: Password validation accepts single-character passwords', async () => {
    // The JS regex allows any length password including a single character.
    // A minimum length of 8 characters with mixed complexity should be enforced.
    await profilePage.fillMandatoryFields({ password: 'a', confirmPassword: 'a' });
    const alert = await profilePage.submitAndGetAlert();
    // Should warn about password strength — currently allows weak passwords through
    expect(alert).not.toBeNull();
  });

  test('BUG-008: LinkedIn field is mandatory despite being labelled optional', async ({ page }) => {
    // The form label reads "LinkedIn URL (optional)" but script.js enforces it as required.
    // Submitting without a LinkedIn URL should succeed.
    await profilePage.firstNameInput.fill(validUser.firstName);
    await profilePage.lastNameInput.fill(validUser.lastName);
    await profilePage.emailInput.fill(validUser.email);
    await profilePage.passwordInput.fill(validUser.password);
    await profilePage.confirmPasswordInput.fill(validUser.confirmPassword);
    // Deliberately leave LinkedIn empty

    const alert = await profilePage.submitAndGetAlert();
    // Expected: no alert (optional field). Actual: "LinkedIn must be filled out"
    expect(alert).toBeNull(); // fails — BUG-008
  });
});
