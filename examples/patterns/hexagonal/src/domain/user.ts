// Domain entity: the core of the hexagon.
// No dependencies on infrastructure, frameworks, or external libraries.
// Business rules live here and are enforced regardless of how the
// entity is persisted or how notifications are delivered.

export interface UserProps {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  active: boolean;
  createdAt: Date;
}

export class User {
  readonly id: string;
  private _email: string;
  private _name: string;
  private _role: 'admin' | 'member';
  private _active: boolean;
  readonly createdAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this._email = props.email;
    this._name = props.name;
    this._role = props.role;
    this._active = props.active;
    this.createdAt = props.createdAt;
  }

  get email(): string {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get role(): 'admin' | 'member' {
    return this._role;
  }

  get active(): boolean {
    return this._active;
  }

  // Business rule: email must contain @ and a domain
  static validateEmail(email: string): void {
    if (!email.includes('@') || email.indexOf('@') === email.length - 1) {
      throw new InvalidEmailError(email);
    }
  }

  // Business rule: name must be at least 2 characters
  static validateName(name: string): void {
    if (name.trim().length < 2) {
      throw new InvalidNameError(name);
    }
  }

  // Factory method that enforces all creation rules
  static create(props: { email: string; name: string; role?: 'admin' | 'member' }): User {
    User.validateEmail(props.email);
    User.validateName(props.name);

    return new User({
      id: crypto.randomUUID(),
      email: props.email.toLowerCase().trim(),
      name: props.name.trim(),
      role: props.role ?? 'member',
      active: true,
      createdAt: new Date(),
    });
  }

  promote(): void {
    if (this._role === 'admin') {
      throw new AlreadyAdminError(this.id);
    }
    this._role = 'admin';
  }

  deactivate(): void {
    if (!this._active) {
      throw new AlreadyDeactivatedError(this.id);
    }
    this._active = false;
  }

  changeName(name: string): void {
    User.validateName(name);
    this._name = name.trim();
  }
}

// Domain errors -- defined alongside the entity they protect

export class InvalidEmailError extends Error {
  constructor(email: string) {
    super(`Invalid email address: "${email}"`);
    this.name = 'InvalidEmailError';
  }
}

export class InvalidNameError extends Error {
  constructor(name: string) {
    super(`Name must be at least 2 characters, got: "${name}"`);
    this.name = 'InvalidNameError';
  }
}

export class AlreadyAdminError extends Error {
  constructor(userId: string) {
    super(`User ${userId} is already an admin`);
    this.name = 'AlreadyAdminError';
  }
}

export class AlreadyDeactivatedError extends Error {
  constructor(userId: string) {
    super(`User ${userId} is already deactivated`);
    this.name = 'AlreadyDeactivatedError';
  }
}
