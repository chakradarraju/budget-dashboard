import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Alert, Collapse, Grid, IconButton, LinearProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AAFF00', '#FF00AA', '#00AAFF'];
const NUMBER_FORMAT = Intl.NumberFormat('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2});

function formatRuppee(n) {
  return '₹' + NUMBER_FORMAT.format(n);
}

function formatNumber(n) {
  return NUMBER_FORMAT.format(n);
}

const Row = ({row, schema, totalValue}) => {
  const [open, setOpen] = React.useState(false);
  const hasSubItems = row?.subitems?.length > 0;
  return (<>
    <TableRow>
      <TableCell>
        {hasSubItems && <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>}
        {row.label}
      </TableCell>
      <TableCell align='right' style={{ fontFamily: 'monospace' }}>
        {(row.value / totalValue * 100).toFixed(2)}
      </TableCell>
      <TableCell align='right' style={{ fontFamily: 'monospace' }}>{formatRuppee(row.value)}</TableCell>
    </TableRow>
    {hasSubItems && <TableRow>
      <TableCell colSpan={3} style={{ padding: 0 }}>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Table size='small' style={{ margin: 0 }}>
            <TableHead>
              <TableRow>
                <TableCell>{schema?.subitems?.label}</TableCell>
                {schema?.subitems?.subvalue1 && <TableCell>{schema.subitems.subvalue1}</TableCell>}
                {schema?.subitems?.subvalue2 && <TableCell>{schema.subitems.subvalue2}</TableCell>}
                <TableCell>%</TableCell>
                <TableCell>{schema?.subitems?.value}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {row.subitems.map(subrow => (<TableRow>
                <TableCell><a href={`./${subrow.index}/`}>{subrow.label}</a></TableCell>
                {subrow?.subvalue1 !== undefined && <TableCell align='right' style={{ fontFamily: 'monospace'}}>{formatRuppee(subrow.subvalue1)}</TableCell>}
                {subrow?.subvalue2 !== undefined && <TableCell align='right' style={{ fontFamily: 'monospace'}}>{formatRuppee(subrow.subvalue2)}</TableCell>}
                <TableCell align='right' style={{ fontFamily: 'monospace'}}>{(subrow.value / row.value * 100).toFixed(2)}</TableCell>
                <TableCell align='right' style={{ fontFamily: 'monospace'}}>{formatRuppee(subrow.value)}</TableCell>
              </TableRow>))}
            </TableBody>
          </Table>
        </Collapse>
      </TableCell>
    </TableRow>}
  </>);
}

const Dashboard = (props) => {

  console.log('Dashboard props', props);

  const { isPending, isError, data, error } = useQuery({
    queryKey: [props.path],
    queryFn: () => axios.get(`/data/${props.path}/index.json`)
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

  console.log('data', data, props);

  const pieData = data.data.data.map(row => ({
    name: row.label,
    value: row.value
  }));

  const totalValue = pieData.reduce((acc, curr) => acc + curr.value, 0);

  return (<>
    <h1>Budget 2024</h1>
    <Grid container style={{ flexWrap: 'wrap' }}>
      <Grid item xs={12} sm={8}>
        <TableContainer component={Paper} style={{padding: '10px'}}>
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow>
                <TableCell><b>{data.data.schema.label}</b></TableCell>
                <TableCell align='right'><b>%</b></TableCell>
                <TableCell align='right'><b>{data.data.schema.value}</b></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><b>Total</b></TableCell>
                <TableCell align='right' style={{ fontFamily: 'monospace' }}>100.00</TableCell>
                <TableCell align='right' style={{ fontFamily: 'monospace' }}><b>{formatRuppee(totalValue)}</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.data.data.map(row => <Row key={row.label} row={row} schema={data.data.schema} totalValue={totalValue} />)}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
      <Grid item xs={12} sm={4}>
        <ResponsiveContainer height={400}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius="85%"
              startAngle={90}
              endAngle={-270}
              isClockwise
              fill="#8884d8"
              dataKey="value"
              label={false}
              isAnimationActive={false}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => {
                const percentage = ((value / totalValue) * 100).toFixed(2);
                return [`${formatRuppee(value)} (${percentage}%)`, name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div>
          Source: <a href={data.data.sourceUrl}>{data.data.label}</a>
        </div>
        <div>
          Source code: <a href="https://github.com/chakradarraju/budget-dashboard">Github</a>
        </div>
      </Grid>
    </Grid>
  </>);
};

export default Dashboard;
