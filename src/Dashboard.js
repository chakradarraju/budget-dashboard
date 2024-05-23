import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Collapse, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

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
                <TableCell>{subrow.label}</TableCell>
                {subrow?.subvalue1 !== undefined && <TableCell align='right' style={{ fontFamily: 'monospace'}}>{subrow.subvalue1.toFixed(2)}</TableCell>}
                {subrow?.subvalue2 !== undefined && <TableCell align='right' style={{ fontFamily: 'monospace'}}>{subrow.subvalue2.toFixed(2)}</TableCell>}
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

const Dashboard = ({data}) => {
  const pieData = data.data.map(row => ({
    name: row.label,
    value: row.value
  }));

  const totalValue = pieData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Grid container style={{ flexWrap: 'wrap' }}>
      <Grid item xs={12} sm={8}>
        <TableContainer component={Paper} style={{padding: '10px'}}>
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow>
                <TableCell><b>{data.schema.label}</b></TableCell>
                <TableCell align='right'><b>%</b></TableCell>
                <TableCell align='right'><b>{data.schema.value}</b></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><b>Total</b></TableCell>
                <TableCell align='right' style={{ fontFamily: 'monospace' }}>100.00</TableCell>
                <TableCell align='right' style={{ fontFamily: 'monospace' }}><b>{formatRuppee(totalValue)}</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.data.map(row => <Row row={row} schema={data.schema} totalValue={totalValue} />)}
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
        <span>
          Source: <a href={data.sourceUrl}>{data.label}</a>
          Source code: <a href="https://github.com/chakradarraju/budget-dashboard">Github</a>
        </span>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
