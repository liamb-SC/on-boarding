// A fake mail sender, shared by the monolith and any function. Don't edit this file.
export const outbox = [];

export async function sendMail(to, subject, text) {
  if (!to || !to.includes('@')) throw new Error(`invalid recipient: ${to}`);
  outbox.push({ to, subject, text });
}
