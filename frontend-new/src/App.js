import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "/api/todos";  
function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await axios.get(API_URL);
      setTodos(res.data); // Should be an array
    } catch (err) {
      console.error("❌ Fetch Error:", err);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      const res = await axios.post(API_URL, { task: input });
      setTodos([...todos, res.data]); // Appends the new object
      setInput("");
    } catch (err) {
      console.error("❌ Add Error:", err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) {
      console.error("❌ Delete Error:", err);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial', textAlign: 'center' }}>
      <h1>Todo List</h1>
      <form onSubmit={addTodo}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="New task..."
          style={{ padding: '8px', width: '200px' }}
        />
        <button type="submit" style={{ padding: '8px 15px', marginLeft: '5px' }}>Add</button>
      </form>

      <div style={{ marginTop: '20px' }}>
        {todos.length === 0 ? <p>No tasks found.</p> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {todos.map(todo => (
              <li key={todo.id} style={{ margin: '10px 0', fontSize: '18px' }}>
                {todo.task}
                <button 
                  onClick={() => deleteTodo(todo.id)}
                  style={{ marginLeft: '15px', color: 'red', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
