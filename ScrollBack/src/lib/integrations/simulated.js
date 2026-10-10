// Learning-goal integrations. Each provider exposes the same two functions so a real OAuth /
// API implementation can replace the simulation without changing any UI code:
//   connect()      -> links the user's account
//   verifyGoal()   -> checks whether today's goal is done and returns evidence

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function simulatedProvider({ id, connectDelay, verifyDelay, evidence }) {
  return {
    id,
    async connect() {
      await wait(connectDelay)
      return { connected: true, source: id }
    },
    async verifyGoal() {
      await wait(verifyDelay)
      return { verified: true, source: id, evidence }
    },
  }
}
