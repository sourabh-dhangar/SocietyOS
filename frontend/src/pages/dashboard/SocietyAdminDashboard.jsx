import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import api from '../../services/api';

import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SocietyAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    totalFlats: 0,
    totalResidents: 0,
    totalPendingDues: 0,
    activeVisitors: 0,
  });
  
  const [financeStats, setFinanceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const promises = [api.get('/dashboard/society-stats')];
        
        // Only fetch finance stats if finance module is active
        if (user?.features?.finance !== false) {
          promises.push(api.get('/finance/stats').catch(() => ({ data: { success: false } })));
        }

        const results = await Promise.all(promises);
        
        if (results[0].data.success) {
          setStats(results[0].data.data);
        }
        
        if (results[1] && results[1].data.success) {
          setFinanceStats(results[1].data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" style={{ color: '#6C63FF' }} />
      </div>
    );
  }

  const metricCards = [
    { label: 'Total Flats', value: stats.totalFlats, color: '#6C63FF', bg: 'rgba(108,99,255,0.08)', icon: '🏠' },
    { label: 'Total Residents', value: stats.totalResidents, color: '#0d6efd', bg: 'rgba(13,110,253,0.08)', icon: '👥' },
    { label: 'Pending Dues', value: `₹${stats.totalPendingDues.toLocaleString('en-IN')}`, color: '#dc3545', bg: 'rgba(220,53,69,0.08)', icon: '💰' },
    { label: 'Active Visitors', value: stats.activeVisitors, color: '#198754', bg: 'rgba(25,135,84,0.08)', icon: '🚪' },
  ];

  return (
    <Container fluid className="p-0">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>Society Overview</h3>
          <p className="text-muted mb-0">Real-time stats for your society</p>
        </div>
        <Button
          style={{ backgroundColor: '#6C63FF', border: 'none' }}
          onClick={() => navigate('/society/bills')}
        >
          💳 Generate Bills
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {stats.totalFlats === 0 && !loading && (
        <Alert variant="warning" className="border-0 shadow-sm rounded-4 mb-4 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="fw-bold mb-1">Welcome! Let's set up your society.</h5>
            <p className="mb-0 text-muted">Your society currently has no flats or residents. Complete the setup wizard to import them.</p>
          </div>
          <Button variant="primary" onClick={() => navigate('/society/setup')} className="rounded-pill px-4 fw-bold">
            Start Setup →
          </Button>
        </Alert>
      )}

      {/* Metric Cards */}
      <Row className="g-4 mb-4">
        {metricCards.map((card, i) => (
          <Col md={3} sm={6} key={i}>
            <Card className="border-0 shadow-sm rounded-4 h-100" style={{ backgroundColor: card.bg }}>
              <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center p-4">
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{card.icon}</div>
                <h2 className="fw-bold mb-1" style={{ color: card.color, fontSize: '28px' }}>
                  {card.value}
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '14px' }}>{card.label}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Bottom Section */}
      <Row className="g-4">
        {/* Quick Actions */}
        <Col md={8}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-0 pt-4 px-4">
              <h5 className="fw-bold mb-0">⚡ Quick Actions</h5>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <Row className="g-3">
                <Col sm={4}>
                  <Button
                    variant="outline-primary"
                    className="w-100 py-3 rounded-3 d-flex flex-column align-items-center gap-1"
                    onClick={() => navigate('/operations/notices')}
                  >
                    <span style={{ fontSize: '24px' }}>📢</span>
                    <span>Add Notice</span>
                  </Button>
                </Col>
                <Col sm={4}>
                  <Button
                    variant="outline-success"
                    className="w-100 py-3 rounded-3 d-flex flex-column align-items-center gap-1"
                    onClick={() => navigate('/society/residents')}
                  >
                    <span style={{ fontSize: '24px' }}>👤</span>
                    <span>Add Resident</span>
                  </Button>
                </Col>
                <Col sm={4}>
                  <Button
                    variant="outline-dark"
                    className="w-100 py-3 rounded-3 d-flex flex-column align-items-center gap-1"
                    onClick={() => navigate('/guard/dashboard')}
                  >
                    <span style={{ fontSize: '24px' }}>🚪</span>
                    <span>Guard Logs</span>
                  </Button>
                </Col>
                <Col sm={4}>
                  <Button
                    variant="outline-danger"
                    className="w-100 py-3 rounded-3 d-flex flex-column align-items-center gap-1"
                    onClick={() => navigate('/operations/helpdesk')}
                  >
                    <span style={{ fontSize: '24px' }}>🔧</span>
                    <span>Helpdesk</span>
                  </Button>
                </Col>
                <Col sm={4}>
                  <Button
                    variant="outline-warning"
                    className="w-100 py-3 rounded-3 d-flex flex-column align-items-center gap-1"
                    onClick={() => navigate('/facilities/inventory')}
                  >
                    <span style={{ fontSize: '24px' }}>📦</span>
                    <span>Inventory</span>
                  </Button>
                </Col>
                <Col sm={4}>
                  <Button
                    variant="outline-info"
                    className="w-100 py-3 rounded-3 d-flex flex-column align-items-center gap-1"
                    onClick={() => navigate('/facilities/documents')}
                  >
                    <span style={{ fontSize: '24px' }}>📄</span>
                    <span>Documents</span>
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Sinking Fund Summary & Chart */}
        <Col md={8}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">📈 Collection Trends</h5>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              {financeStats?.monthlyTrend?.length > 0 ? (
                <div style={{ height: '250px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financeStats.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} tickFormatter={(val) => `₹${val / 1000}k`} />
                      <Tooltip 
                        cursor={{fill: 'rgba(108,99,255,0.05)'}} 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Collected']}
                        labelStyle={{fontWeight: 'bold', color: '#374151'}}
                      />
                      <Bar dataKey="amount" fill="#6C63FF" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                  <p>No collection data available yet.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-0 pt-4 px-4">
              <h5 className="fw-bold mb-0">🏦 Sinking Fund</h5>
            </Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center px-4 pb-4">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-sm"
                style={{
                  width: '120px',
                  height: '120px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#fff',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>Deposits</div>
                  <div className="fw-bold" style={{ fontSize: '22px' }}>
                    ₹{(financeStats?.sinkingFundCollected || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
              <p className="text-muted" style={{ fontSize: '13px' }}>
                Accumulated from paid bills containing Sinking Fund charges. Keep this reserve safe for major repairs.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SocietyAdminDashboard;
