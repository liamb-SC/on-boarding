// Expensive work the product team insists on: ~300ms of recommendations
// scoring. Don't edit this file: change WHEN app.js calls it.
window.buildRecommendations = function buildRecommendations(seed) {
  const end = performance.now() + 300;
  let score = seed;
  while (performance.now() < end) score = (score * 31 + 7) % 1000003;
  return ['Trail socks', 'Spare laces', 'Ankle gaiters'];
};
