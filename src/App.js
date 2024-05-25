import './App.css';
import { Grid, List, ListItemButton, ListItemText } from '@mui/material';
import HomePage from './HomePage';
import Dashboard from './Dashboard';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import DepartmentDashboard from './DepartmentDashboard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />
  }, {
    path: '/india/2024/',
    element: <Dashboard path="india/2024" />
  }, {
    path: '/india/2024/:departmentId',
    element: <DepartmentDashboard path="india/2024" />
  }
]);

const App = () => {
  return (
    <Grid container>
      <Grid item sm={2}>
        <List>
          <ListItemButton to="/">
            <ListItemText primary="Home" />
          </ListItemButton>
          <ListItemButton to="/india/2024/">
            <ListItemText primary="India 2024" />
          </ListItemButton>
        </List>
      </Grid>
      <Grid item sm={10}>
        <RouterProvider router={router} />
      </Grid>
    </Grid>);
}
/*
<SimpleTreeView>
      {data.data.data.map(d => (<TreeItem itemId={d.id} label={d.label}>
        {d.data.map(i => <TreeItem itemId={i.id} label={i.label} onLabelClick={() => alert('clicked')}></TreeItem>)}
      </TreeItem>))}
    </SimpleTreeView>
*/

export default App;
