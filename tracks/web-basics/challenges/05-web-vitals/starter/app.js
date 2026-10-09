// "Add to basket": all the work happens before the browser gets a chance to
// paint, so the button feels frozen.
let count = 0;
const basket = document.getElementById('basket');
const recs = document.getElementById('recs');

document.getElementById('add').addEventListener('click', () => {
  const items = window.buildRecommendations(count);
  count += 1;
  basket.textContent = `${count} in basket`;
  recs.replaceChildren(...items.map((name) => {
    const li = document.createElement('li');
    li.textContent = name;
    return li;
  }));
});

// A promo banner that arrives a second late and pushes everything down.
setTimeout(() => {
  document.getElementById('promo').innerHTML = '<p>Free delivery this week only!</p>';
}, 1000);
