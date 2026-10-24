// Non-secret, account-scoped selection for the next request. Never stores an API key.
const choices = new Map()
export const coachChoice = uid => uid ? { ...(choices.get(uid) || {}) } : {}
export const setCoachChoice = (uid, choice) => { if (uid) choices.set(uid, { connectionId: choice.connectionId || choice.id, model: choice.model }) }
