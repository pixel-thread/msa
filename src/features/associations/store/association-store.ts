import { AsyncLocalStorage } from 'async_hooks';

export const associationStore = new AsyncLocalStorage<string>();

export const getAssociationId = () => associationStore.getStore();

export const runWithAssociation = <T>(associationId: string, handler: () => T): T => {
  return associationStore.run(associationId, handler);
};
