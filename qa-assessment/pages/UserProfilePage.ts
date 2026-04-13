import { type Page, type Locator } from '@playwright/test';
import { validUser } from '../tests/test-data';

/**
 * Page Object Model for the User Profile creation form.
 * Based on actual DOM at https://qa-assessment.pages.dev/
 *
 * Form uses alert() dialogs for validation errors and appends a
 * <p class="success"> element on successful submission.
 */
export class UserProfilePage {
  readonly page: Page;

  // Mandatory fields
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;

  // Optional fields
  readonly genderMaleRadio: Locator;
  readonly genderFemaleRadio: Locator;
  readonly genderPreferNotToSayRadio: Locator;
  readonly dateOfBirthInput: Locator;
  readonly phoneNumberInput: Locator;
  readonly addressInput: Locator;
  readonly linkedinUrlInput: Locator;
  readonly githubUrlInput: Locator;

  // Actions
  readonly submitButton: Locator;

  // Feedback
  readonly successMessage: Locator;

  // Security
  readonly adminPasswordSpan: Locator;

  constructor(page: Page) {
    this.page = page;

    // Mandatory fields (matched to actual IDs in the DOM)
    this.firstNameInput = page.locator('#firstName');
    this.lastNameInput = page.locator('#lastName');
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.confirmPasswordInput = page.locator('#confirmPassword');

    // Gender is radio buttons, not a select
    this.genderMaleRadio = page.locator('#male');
    this.genderFemaleRadio = page.locator('#female');
    this.genderPreferNotToSayRadio = page.locator('#preferNotToSay');

    // Other optional fields
    this.dateOfBirthInput = page.locator('#dob');
    this.phoneNumberInput = page.locator('#phone');
    this.addressInput = page.locator('#address');
    this.linkedinUrlInput = page.locator('#linkedIn');
    this.githubUrlInput = page.locator('#github');

    // Submit is an input[type="submit"], not a button
    this.submitButton = page.locator('input[type="submit"]');

    // Success message: dynamically appended <p class="success">
    this.successMessage = page.locator('p.success');

    // Hidden admin password element (security issue)
    this.adminPasswordSpan = page.locator('#adminPassword');
  }

  async goto() {
    await this.page.goto('/');
  }

  /**
   * Fill all mandatory fields with valid data.
   * Note: LinkedIn is treated as mandatory by the JS validation (bug),
   * so we include it here to allow happy-path tests to pass.
   */
  async fillMandatoryFields(data?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    linkedinUrl?: string;
  }) {
    const defaults = { ...validUser };
    const merged = { ...defaults, ...data };

    await this.firstNameInput.fill(merged.firstName);
    await this.lastNameInput.fill(merged.lastName);
    await this.emailInput.fill(merged.email);
    await this.passwordInput.fill(merged.password);
    await this.confirmPasswordInput.fill(merged.confirmPassword);
    await this.linkedinUrlInput.fill(merged.linkedinUrl);
  }

  /**
   * Fill optional fields. Gender is selected via radio button.
   */
  async fillOptionalFields(data?: {
    gender?: 'male' | 'female' | 'preferNotToSay';
    dateOfBirth?: string;
    phoneNumber?: string;
    address?: string;
    githubUrl?: string;
  }) {
    if (data?.gender) {
      const radioMap = {
        male: this.genderMaleRadio,
        female: this.genderFemaleRadio,
        preferNotToSay: this.genderPreferNotToSayRadio,
      };
      await radioMap[data.gender].check();
    }
    if (data?.dateOfBirth) await this.dateOfBirthInput.fill(data.dateOfBirth);
    if (data?.phoneNumber) await this.phoneNumberInput.fill(data.phoneNumber);
    if (data?.address) await this.addressInput.fill(data.address);
    if (data?.githubUrl) await this.githubUrlInput.fill(data.githubUrl);
  }

  async submit() {
    await this.submitButton.click();
  }

  /**
   * Helper to capture alert dialog text when submitting.
   * Sets up a one-time dialog listener, submits, and returns the alert message.
   * Returns null if no alert appeared (e.g. success path).
   */
  async submitAndGetAlert(): Promise<string | null> {
    let alertMessage: string | null = null;

    const dialogHandler = (dialog: any) => {
      alertMessage = dialog.message();
      dialog.dismiss();
    };

    this.page.once('dialog', dialogHandler);
    await this.submit();

    // Small wait to allow dialog to fire
    await this.page.waitForTimeout(500);
    return alertMessage;
  }

  /**
   * Check if the success message is visible after form submission.
   */
  async isSuccessMessageVisible(): Promise<boolean> {
    try {
      await this.successMessage.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async getSuccessMessageText(): Promise<string> {
    return this.successMessage.textContent() as Promise<string>;
  }
}
