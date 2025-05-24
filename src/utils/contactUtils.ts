/**
 * Utility functions for contact information validation and standardization
 * Used for duplicate lead prevention in the lead management system
 */

/**
 * Checks if a string is a valid email address
 */
export function isEmail(value: string): boolean {
  if (!value) return false;
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Checks if a string is a phone number
 */
export function isPhoneNumber(value: string): boolean {
  if (!value) return false;
  // Check if the string contains at least some digits
  // and is not an email (to differentiate between the two)
  return /\d/.test(value) && !isEmail(value);
}

/**
 * Standardizes an email address for comparison
 * - Converts to lowercase
 * - Trims whitespace
 */
export function standardizeEmail(email: string): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

/**
 * Standardizes a phone number for comparison
 * - Removes all non-numeric characters
 */
export function standardizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove all non-numeric characters
  return phone.replace(/\D/g, '');
}

/**
 * Standardizes contact information (email or phone) for comparison
 * - Detects the type of contact info
 * - Applies the appropriate standardization
 */
export function standardizeContactInfo(contactInfo: string): string {
  if (!contactInfo) return '';
  
  if (isEmail(contactInfo)) {
    return standardizeEmail(contactInfo);
  } else if (isPhoneNumber(contactInfo)) {
    return standardizePhoneNumber(contactInfo);
  }
  
  // If we can't determine the type, just trim and lowercase
  return contactInfo.toLowerCase().trim();
}

/**
 * Formats a contact info value for display
 * - For emails: returns as is
 * - For phone numbers: formats with appropriate separators
 */
export function formatContactInfoForDisplay(contactInfo: string): string {
  if (!contactInfo) return '';
  
  if (isEmail(contactInfo)) {
    return contactInfo;
  } else if (isPhoneNumber(contactInfo)) {
    // Get only the digits
    const digits = contactInfo.replace(/\D/g, '');
    
    // Format based on length (assuming US numbers, but works for others too)
    if (digits.length === 10) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
    }
    
    // For other formats, just return as is
    return contactInfo;
  }
  
  return contactInfo;
}
