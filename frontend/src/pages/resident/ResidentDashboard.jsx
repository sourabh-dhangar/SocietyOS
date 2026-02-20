import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ResidentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myBills, setMyBills] = useState([]);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const { data } = await api.get('/finance/my-bills');
        if (data.success) {
          setMyBills(data.data);
          const due = data.data
            .filter((b) => b.status === 'pending' || b.status === 'overdue')
            .reduce((sum, b) => sum + (b.amount || 0), 0);
          setTotalDue(due);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" style={{ color: '#6C63FF' }} />
      </div>
    );
  }

  const paidBills = myBills.filter((b) => b.status === 'paid').length;
  const pendingBills = myBills.filter((b) => b.status === 'pending' || b.status === 'overdue').length;

  return (
    <Container fluid className="p-0">
      {/* Welcome Header */}
      <div className="mb-4">
        <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>
          Welcome, {user?.firstName || 'Resident'}! 👋
        </h3>
        <p className="text-muted mb-0">Here's your society dashboard</p>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Outstanding Dues Card */}
      <Card
        className="text-white text-center p-4 mb-4 rounded-4 shadow border-0"
        style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #A78BFA 100%)' }}
      >
        <Card.Body>
          <p className="mb-1" style={{ fontSize: '14px', opacity: 0.85 }}>Total Outstanding Dues</p>
          <h1 className="fw-bold mb-3" style={{ fontSize: '42px' }}>
            ₹{totalDue.toLocaleString('en-IN')}
          </h1>
          <div className="d-flex justify-content-center gap-4 mb-3" style={{ fontSize: '14px', opacity: 0.85 }}>
            <span>📄 {myBills.length} Total Bills</span>
            <span>✓ {paidBills} Paid</span>
            <span>● {pendingBills} Pending</span>
          </div>
          <Button
            variant="light"
            size="lg"
            className="rounded-pill px-5 fw-semibold"
            style={{ color: '#6C63FF' }}
            onClick={() => navigate('/resident/bills')}
          >
            💳 Pay Dues
          </Button>
        </Card.Body>
      </Card>

      {/* Quick Actions */}
      <h5 className="fw-bold mb-3" style={{ color: '#1a1a2e' }}>⚡ Quick Actions</h5>
      <Row className="g-3">
        <Col xs={6} md={3}>
          <Card
            className="border-0 shadow-sm rounded-4 h-100 text-center"
            role="button"
            onClick={() => navigate('/resident/bills')}
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Card.Body className="py-4">
              <div style={{ fontSize: '32px' }}>💳</div>
              <p className="fw-semibold mb-0 mt-2">My Bills</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card
            className="border-0 shadow-sm rounded-4 h-100 text-center"
            role="button"
            onClick={() => navigate('/notices')}
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Card.Body className="py-4">
              <div style={{ fontSize: '32px' }}>📢</div>
              <p className="fw-semibold mb-0 mt-2">Notice Board</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card
            className="border-0 shadow-sm rounded-4 h-100 text-center"
            role="button"
            onClick={() => navigate('/complaints')}
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Card.Body className="py-4">
              <div style={{ fontSize: '32px' }}>🔧</div>
              <p className="fw-semibold mb-0 mt-2">Raise Complaint</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card
            className="border-0 shadow-sm rounded-4 h-100 text-center"
            role="button"
            onClick={() => navigate('/visitors')}
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Card.Body className="py-4">
              <div style={{ fontSize: '32px' }}>🚪</div>
              <p className="fw-semibold mb-0 mt-2">My Visitors</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ResidentDashboard;
