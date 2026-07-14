export function evaluateAction(operation, messages = {}) {
  try {
    const result = operation();
    const ok = result !== false && result?.ok !== false;
    const message = ok
      ? messages.success || result?.message || result?.log || 'Action completed.'
      : result?.reason || result?.message || messages.failure || 'That action is not available right now.';
    return { result, ok, message, bad: !ok };
  } catch {
    return { result:false, ok:false, message:messages.error || 'The action could not be completed. Your life was not advanced.', bad:true };
  }
}
