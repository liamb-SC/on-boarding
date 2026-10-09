// Predict the output BEFORE running this. Write your prediction in
// event-loop.answer.txt, then run `node event-loop.cjs` to check yourself.
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
process.nextTick(() => console.log('D'));
queueMicrotask(() => console.log('E'));
(async () => {
  console.log('F');
  await null;
  console.log('G');
})();
console.log('H');
