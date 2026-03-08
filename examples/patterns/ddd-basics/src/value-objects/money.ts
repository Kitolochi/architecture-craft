// Value Object: defined by its attributes, not by identity.
// Two Money instances with the same amount and currency are equal.
// Value objects are immutable -- operations return new instances.

export class Money {
  constructor(
    readonly amount: number,
    readonly currency: string
  ) {
    if (amount < 0) {
      throw new InvalidMoneyError(`Amount cannot be negative: ${amount}`);
    }
    if (currency.length !== 3) {
      throw new InvalidMoneyError(`Currency must be a 3-letter code, got: "${currency}"`);
    }
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(
      Math.round((this.amount + other.amount) * 100) / 100,
      this.currency
    );
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = Math.round((this.amount - other.amount) * 100) / 100;
    if (result < 0) {
      throw new InvalidMoneyError('Subtraction would result in negative amount');
    }
    return new Money(result, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(
      Math.round(this.amount * factor * 100) / 100,
      this.currency
    );
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
  }
}

export class InvalidMoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMoneyError';
  }
}

export class CurrencyMismatchError extends Error {
  constructor(a: string, b: string) {
    super(`Cannot operate on different currencies: ${a} and ${b}`);
    this.name = 'CurrencyMismatchError';
  }
}
