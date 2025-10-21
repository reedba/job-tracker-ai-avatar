import { useState, useEffect } from 'react';

export function DebugExample() {
  const [count, setCount] = useState(0);
  const [data, setData] = useState(null);

  // Example async function to demonstrate debugging
  async function fetchData() {
    debugger; // Breakpoint 1: Will pause before fetch
    try {
      const response = await fetch('https://api.example.com/data');
      debugger; // Breakpoint 2: Examine response
      const result = await response.json();
      return result;
    } catch (error) {
      debugger; // Breakpoint 3: Debug errors
      console.error('Error fetching data:', error);
    }
  }

  // Example event handler
  const handleClick = () => {
    debugger; // Breakpoint 4: Step through calculation
    const newCount = count + 1;
    setCount(newCount);
    
    // Complex calculation example
    const calculation = (() => {
      const base = newCount * 2;
      debugger; // Breakpoint 5: Step into nested function
      return base * 3;
    })();
    
    console.log('Calculation result:', calculation);
  };

  useEffect(() => {
    debugger; // Breakpoint 6: Debug component lifecycle
    fetchData().then(result => {
      debugger; // Breakpoint 7: Examine fetch result
      setData(result);
    });
  }, []);

  return (
    <div>
      <h2>Debug Example Component</h2>
      <p>Count: {count}</p>
      <button onClick={handleClick}>
        Increment Count
      </button>
      {data && (
        <div>
          <h3>Data:</h3>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
