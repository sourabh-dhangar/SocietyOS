import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import api from '../../services/api';

const SocietyAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalFlats: 0,
    totalResidents: 0,
    totalPendingDues: 0,
    activeVisitors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/society-stats');
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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
          onClick={() => navigate('/finance')}
        >
          💳 Generate Bills
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

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
                    onClick={() => navigate('/notices')}
                  >
                    <span style={{ fontSize: '24px' }}>📢</span>
                    <span>Add Notice</span>
                  </Button>
                </Col>
                <Col sm={4}>
                  <Button
                    variant="outline-success"
                    className="w-100 py-3 rounded-3 d-flex flex-column align-items-center gap-1"
                    onClick={() => navigate('/residents')}
                  >
                    <span style={{ fontSize: '24px' }}>👤</span>
                    <span>Add Resident</span>
                  </Button>
                </Col>
                <Col sm={4}>
                  <Button
                    variant="outline-dark"
                    className="w-100 py-3 rounded-3 d-flex flex-column align-items-center gap-1"
                    onClick={() => navigate('/visitors')}
                  >
                    <span style={{ fontSize: '24px' }}>🚪</span>
                    <span>Guard Logs</span>
                  </Button>
                </Col>
                <Col sm={4}>
                  <Button
                    variant="outline-danger"
                    className="w-100 py-3 rounded-3 d-flex flex-column align-items-center gap-1"
                    onClick={() => navigate('/complaints')}
                  >
                    <span style={{ fontSize: '24px' }}>🔧</span>
                    <span>Helpdesk</span>
                  </Button>
                </Col>
                <Col sm={4}>
                  <Button
                    variant="outline-warning"
                    className="w-100 py-3 rounded-3 d-flex flex-column align-items-center gap-1"
                    onClick={() => navigate('/inventory')}
                  >
                    <span style={{ fontSize: '24px' }}>📦</span>
                    <span>Inventory</span>
                  </Button>
                </Col>
                <Col sm={4}>
                  <Button
                    variant="outline-info"
                    className="w-100 py-3 rounded-3 d-flex flex-column align-items-center gap-1"
                    onClick={() => navigate('/documents')}
                  >
                    <span style={{ fontSize: '24px' }}>📄</span>
                    <span>Documents</span>
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Sinking Fund Summary */}
        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-0 pt-4 px-4">
              <h5 className="fw-bold mb-0">🏦 Sinking Fund</h5>
            </Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center px-4 pb-4">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                style={{
                  width: '100px',
                  height: '100px',
                  background: 'linear-gradient(135deg, #6C63FF 0%, #A78BFA 100%)',
                  color: '#fff',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px' }}>Collected</div>
                  <div className="fw-bold" style={{ fontSize: '18px' }}>₹0</div>
                </div>
              </div>
              <p className="text-muted" style={{ fontSize: '13px' }}>
                Sinking fund tracking will be available once bills are generated with sinking fund line items.
              </p>
              <Button
                variant="light"
                size="sm"
                className="rounded-pill px-3"
                disabled
              >
                Coming Soon
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SocietyAdminDashboard;
