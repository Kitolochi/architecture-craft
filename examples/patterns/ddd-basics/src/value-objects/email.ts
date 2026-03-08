// Value Object: encapsulates email validation and normalization.
// Once created, the email is guaranteed to be valid -- no need to
// re-validate at every usage point in the domain.

export class Email {
  readonly value: string;

  constructor(value: string) {
    const normalized = value.toLowerCase().trim();

    if (!normalized.includes('@')) {
      throw new InvalidEmailError(value);
    }

    const [local, domain] = normalized.split('@');
    if (!local || local.length === 0) {
      throw new InvalidEmailError(value);
    }
    if (!domain || !domain.includes('.')) {
      throw new InvalidEmailError(value);
    }

    this.value = normalized;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  get domain(): string {
    return this.value.split('@')[1]!;
  }

  toString(): string {
    return this.value;
  }
}

export class InvalidEmailError extends Error {
  constructor(email: string) {
    super(`Invalid email address: "${email}"`);
    this.name = 'InvalidEmailError';
  }
}
