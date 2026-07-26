/**
 * RFC4122-ish v4 generator for client-side ids. Movement ids are not security
 * sensitive, so a Math.random source is fine; the point is that the optimistic
 * row and the server row share the same id, so success needs no reconciliation
 * and Realtime echoes de-duplicate cleanly.
 */
export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
