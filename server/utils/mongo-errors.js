/** True when a Mongo write failed because a unique index was violated. */
export function isDuplicateKeyError(error) {
  return error?.code === 11000 || error?.code === 11001;
}
