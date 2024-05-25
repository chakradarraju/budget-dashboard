import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query'
import { LinearProgress, Alert, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Grid } from '@mui/material';

const NUMBER_FORMAT = Intl.NumberFormat('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2});

function formatRuppee(n) {
  return '₹' + NUMBER_FORMAT.format(n);
}

function buildTableForSection(section, name) {
  if (section.length === 0) return (<></>);
  const total = section.reduce((p, v) => {
    p.revenue += v['2024_budget']?.revenue || 0;
    p.capital += v['2024_budget']?.capital || 0;
    p.total += v['2024_budget']?.total || 0;
    return p;
  }, {revenue: 0, capital: 0, total: 0});
  console.log('total', total);
  return (<>
    <h3>{name}</h3>
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell align='right'>Revenue</TableCell>
            <TableCell align='right'>Capital</TableCell>
            <TableCell align='right'>Total</TableCell>
          </TableRow>
          <TableRow>
            <TableCell></TableCell>
            <TableCell align='right' style={{ fontFamily: 'monospace'}}>{formatRuppee(total.revenue)}</TableCell>
            <TableCell align='right' style={{ fontFamily: 'monospace'}}>{formatRuppee(total.capital)}</TableCell>
            <TableCell align='right' style={{ fontFamily: 'monospace'}}>{formatRuppee(total.total)}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {section.map(row => <TableRow>
            <TableCell>{row.name}</TableCell>
            <TableCell align='right' style={{ fontFamily: 'monospace'}}>{formatRuppee(row['2024_budget']?.revenue || 0)}</TableCell>
            <TableCell align='right' style={{ fontFamily: 'monospace'}}>{formatRuppee(row['2024_budget']?.capital || 0)}</TableCell>
            <TableCell align='right' style={{ fontFamily: 'monospace'}}>{formatRuppee(row['2024_budget']?.total || 0)}</TableCell> 
          </TableRow>)}
        </TableBody>
      </Table>
    </TableContainer>
  </>);
}

const DepartmentDashboard = ({path}) => {
  const { departmentId } = useParams();

  const { isPending, isError, data, error } = useQuery({
    queryKey: ['index'],
    queryFn: () => axios.get(`/data/${path}/${departmentId}.json`)
  });

  if (isPending) {
    return <LinearProgress></LinearProgress>
  }

  if (isError) {
    return (<Alert variant="filled" severity="error">
      Unable to load data.
      <pre>{error}</pre>
    </Alert>);
  }

  return (<>
    <h1>India Budget 2024 - {data.data.name}</h1>
    <h2>{data.data.department}</h2>
    <Grid container style={{ flexWrap: 'wrap' }}>
      <Grid item xs={12} sm={8}>
        {buildTableForSection(data.data.sections.allocation, 'Budget allocation')}
        {buildTableForSection(data.data.sections.development_heads, 'Development heads')}
        {buildTableForSection(data.data.sections.public_enterprises, 'Public enterprises')}
      </Grid>
      <Grid item xs={12} sm={4}>

      </Grid>
    </Grid>
  </>)
};

export default DepartmentDashboard;