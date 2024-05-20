import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { budgetData } from './budgetData';
import { Grid } from '@mui/material';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AAFF00', '#FF00AA', '#00AAFF'];

const Budget = () => {
  budgetData.ministries = budgetData.ministries.sort((a, b) => b.total - a.total);

  const pieData = budgetData.ministries.map(ministry => ({
    name: ministry.ministry,
    value: ministry.total
  }));

  const totalExpenditure = pieData.reduce((acc, curr) => acc + curr.value, 0);

  console.log('pieData', pieData, totalExpenditure);


  return (
    <div>
      <h1>Budget 2024</h1>
      <Grid container style={{ flexWrap: 'wrap' }}>
        <Grid item xs={12} sm={8}>
          <table>
            <thead>
              <tr>
                <th>Ministry</th>
                <th>Total Expenditure (in cr.)</th>
              </tr>
            </thead>
            <tbody>
              {budgetData.ministries.map(ministry => (
                <tr key={ministry.ministry}>
                  <td>{ministry.ministry}</td>
                  <td>{ministry.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  const percentage = ((value / totalExpenditure) * 100).toFixed(2);
                  return [`₹${value.toLocaleString()} (${percentage}%)`, name];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <span>
            Source: <a href="https://www.indiabudget.gov.in/doc/eb/allsbe.pdf">Expenditure Budget 2024-25</a>
          </span>
        </Grid>
      </Grid>
    </div>
  );
};

export default Budget;
