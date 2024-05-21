import './App.css';
import Dashboard from './Dashboard';
import { useEffect, useState } from 'react';
import { LinearProgress, Alert } from '@mui/material';
import axios from 'axios';

function App() {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = '/data/india2024Data.json';
    axios.get(url)
    .then((response) => {
      setData(response.data);
      setLoading(false);
    })
    .catch((error) => {
      setError(error);
      setLoading(false);
    });
  }, []);

  return (
    <div className="App">
      <h1>Budget 2024</h1>
      {loading && <LinearProgress />}
      {error && <Alert variant="filled" severity="error">
        Unable to load data.
        <pre>{error}</pre>
      </Alert>}
	    {!loading && !error && <Dashboard data={data} />}
    </div>
  );
}

export default App;
