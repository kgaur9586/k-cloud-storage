export class ApplicationError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = 'ApplicationError';
  }
  
  toJSON() {
    return {
      message: this.message,
      name: this.name,
      stack: this.stack
    };
  }
}
