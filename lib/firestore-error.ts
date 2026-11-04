export enum OperationType {
  CREATE = 'create',
  GET = 'get',
  LIST = 'list',
  UPDATE = 'update',
  DELETE = 'delete',
  WRITE = 'write',
}

export function handleFirestoreError(
  error: any,
  operation: OperationType,
  path: string
): void {
  const errCode = error?.code || 'unknown';
  const errMessage = error?.message || String(error);

  if (errCode === 'unavailable' || errMessage.includes('offline')) {
    return;
  }

  console.warn(`[Firestore ${operation.toUpperCase()} at ${path}]: ${errCode} - ${errMessage}`);
}
