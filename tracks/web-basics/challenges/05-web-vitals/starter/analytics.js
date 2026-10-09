// A "tag manager" from a third party. Like many, it does a lot of synchronous
// work as soon as it loads. Don't edit this file: change how it's loaded.
(function () {
  const end = performance.now() + 400;
  while (performance.now() < end) { /* pretend to set up tracking */ }
  console.log('[analytics] ready');
}());
