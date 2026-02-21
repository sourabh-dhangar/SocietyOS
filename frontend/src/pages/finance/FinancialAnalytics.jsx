import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import api from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3'];

const FinancialAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finance/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch financial stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger" className="m-4">{error}</Alert>;
  if (!stats) return null;

  // Prepare data for Monthly Billing Trend (Billed vs Collected vs Pending)
  const billingTrendData = [...(stats.monthlyBillTrend || [])].map(item => ({
    month: item._id,
    'Generated': item.totalBilled,
    'Collected': item.totalCollected,
    'Pending': item.totalPending,
  }));

  // Prepare data for Charge Breakdown Pie Chart
  const pieData = [...(stats.chargeBreakdown || [])].map(item => ({
    name: item._id,
    value: item.totalAmount
  }));

  // Generic formatting function for currency
  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <Container fluid className="p-0 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>📈 Financial Analytics</h3>
          <p className="text-muted mb-0">Overview of society collections and outstanding dues</p>
        </div>
      </div>

      {/* Top Summary Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-primary text-white">
            <Card.Body className="p-4">
              <p className="mb-1 opacity-75 fw-medium">Total Collected (All Time)</p>
              <h3 className="fw-bold mb-0">{formatCurrency(stats.totalCollected)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-danger text-white">
            <Card.Body className="p-4">
              <p className="mb-1 opacity-75 fw-medium">Total Outstanding Dues</p>
              <h3 className="fw-bold mb-0">{formatCurrency(stats.totalPending)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-success text-white">
            <Card.Body className="p-4">
               <p className="mb-1 opacity-75 fw-medium">Collection Rate</p>
               <h3 className="fw-bold mb-0">{stats.collectionRate}%</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100" style={{ backgroundColor: '#6C63FF', color: 'white' }}>
            <Card.Body className="p-4">
               <p className="mb-1 opacity-75 fw-medium">Sinking Fund Reserves</p>
               <h3 className="fw-bold mb-0">{formatCurrency(stats.sinkingFundCollected)}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Monthly Billing vs Collection Trend */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-0 pt-4 pb-0 px-4">
              <h6 className="fw-bold mb-0 text-secondary">Monthly Billing vs Collection (Last 6 Months)</h6>
            </Card.Header>
            <Card.Body className="p-4">
              {billingTrendData.length === 0 ? (
                 <div className="text-center text-muted p-5">No billing data available yet.</div>
              ) : (
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <BarChart data={billingTrendData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="month" tick={{ fill: '#6B7280' }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(value) => `₹${value / 1000}k`} tick={{ fill: '#6B7280' }} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: '#f8f9fa' }} />
                      <Legend iconType="circle" />
                      <Bar dataKey="Generated" fill="#E5E7EB" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="Collected" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="Pending" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Charge Head Breakdown Pie Chart */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-0 pt-4 pb-0 px-4">
              <h6 className="fw-bold mb-0 text-secondary">Revenue by Charge Head All Time</h6>
            </Card.Header>
            <Card.Body className="p-4 d-flex flex-column align-items-center justify-content-center">
              {pieData.length === 0 ? (
                 <div className="text-muted p-5">No charge data available.</div>
              ) : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend iconType="circle" layout="vertical" verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mt-1">
        {/* Recent Payment Volume (Line Chart) */}
        <Col lg={12}>
          <Card className="border-0 shadow-sm rounded-4">
             <Card.Header className="bg-white border-0 pt-4 pb-0 px-4">
              <h6 className="fw-bold mb-0 text-secondary">Payment Volume Trend (₹)</h6>
            </Card.Header>
            <Card.Body className="p-4">
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={stats.monthlyTrend || []} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="_id" tick={{ fill: '#6B7280' }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(value) => `₹${value / 1000}k`} tick={{ fill: '#6B7280' }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="amount" name="Amount Received" stroke="#6C63FF" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default FinancialAnalytics;
