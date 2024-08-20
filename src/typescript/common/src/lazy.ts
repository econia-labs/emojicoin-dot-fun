export class Lazy<T> {
  generator: () => T;

  data: T | null = null;

  constructor(generator: () => T) {
    this.generator = generator;
  }

  get(): T {
    if (this.data === null) {
      this.data = this.generator();
    }
    return this.data;
  }
}

export class LazyPromise<T> {
  generator: () => Promise<T>;

  data: T | null = null;

  constructor(generator: () => Promise<T>) {
    this.generator = generator;
  }

  async get(): Promise<T> {
    if (this.data === null) {
      this.data = await this.generator();
    }
    return this.data;
  }
}
