// Bug report: "the buttons do nothing". The variable changes, but React has
// no idea it should re-render, and it resets to 0 on every render anyway.
export default function Counter() {
  let count = 0;

  function increment() {
    count = count + 1;
  }

  function addThree() {
    increment();
    increment();
    increment();
  }

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+1</button>
      <button onClick={addThree}>+3</button>
      <button onClick={() => { count = 0; }}>Reset</button>
    </div>
  );
}
