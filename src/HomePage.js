import { Button } from "@mui/material";

const HomePage = () => {
  return (<>
    <h1>Budget Dashboard</h1>
    <p>
      This dashboard is made to visualise Indian government budget for 2024.
    </p>
    <p>
      Data is extracted from Source: <a href="https://www.indiabudget.gov.in/doc/eb/allsbe.pdf" target="_blank">Expenditure Budget 2024-25</a>
    </p>
    <p>
      <Button variant="contained" color="primary" href="/india/2024/">Click here to explore</Button>
    </p>
    <div>
      Source code: <a href="https://github.com/chakradarraju/budget-dashboard">Github</a>
    </div>
    <div style={{position: 'absolute', bottom: 0, right: 0, color: 'gray'}}>
      I ♡ my pondati
    </div>
  </>)
  
  
};

export default HomePage;