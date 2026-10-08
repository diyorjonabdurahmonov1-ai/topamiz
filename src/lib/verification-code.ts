// Length of the SMS verification code. It has to match the template
// approved in the Eskiz cabinet, which uses a 4-digit code.
export const CODE_LENGTH = 4;

export function isCodeShaped(code: string): boolean {
  return new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code);
}
