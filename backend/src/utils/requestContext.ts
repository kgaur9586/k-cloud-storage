import { AsyncLocalStorage } from 'async_hooks';

class RequestContextService {
  private storage = new AsyncLocalStorage<Map<string, any>>();

  getRequestId(): string | undefined {
    const store = this.storage.getStore();
    return store?.get('requestId');
  }

  getContext(): Record<string, any> {
    const store = this.storage.getStore();
    return store ? Object.fromEntries(store) : {};
  }
}

export const requestContextService = new RequestContextService();
