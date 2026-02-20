import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, ListGroup } from 'react-bootstrap';
import api from '../../services/api';
import VisitorEntryModal from '../../components/security/VisitorEntryModal';

const GateDashboard = () => {
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [checkingOut, setCheckingOut] = useState(null); // tracks which visitor is being checked out

  const fetchData = async () => {
    try {
      setLoading(true);
      const [visitorsRes, flatsRes] = await Promise.all([
        api.get('/security/visitors/active'),
        api.get('/core/flats'),
      ]);
      if (visitorsRes.data.success) setActiveVisitors(visitorsRes.data.data);
      if (flatsRes.data.success) setFlats(flatsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load gate data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckOut = async (visitorId) => {
    setCheckingOut(visitorId);
    setError('');
    try {
      const { data } = await api.put(`/security/visitors/${visitorId}`, {
        status: 'checked_out',
      });
      if (data.success) {
        setSuccessMsg('Visitor checked out successfully!');
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Check-out failed.');
    } finally {
      setCheckingOut(null);
    }
  };

  const getTimeSince = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m ago`;
  };

  const getPurposeColor = (purpose) => {
    const map = { Guest: 'primary', Delivery: 'warning', Service: 'info', Cab: 'secondary', Other: 'dark' };
    return map[purpose] || 'secondary';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" style={{ color: '#198754' }} />
      </div>
    );
  }

  return (
    <Container fluid className="p-0">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="fw-bold" style={{ color: '#1a1a2e' }}>🚪 Gate Dashboard</h2>
        <p className="text-muted mb-0">
          <Badge bg="success" className="px-3 py-2 fs-6">
            {activeVisitors.length} Visitors Inside
          </Badge>
        </p>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {successMsg && <Alert variant="success" dismissible onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {/* Action Buttons — Large & Touch-Friendly */}
      <Row className="g-3 mb-4">
        <Col xs={6}>
          <Button
            size="lg"
            className="w-100 py-3 fw-bold rounded-4 shadow-sm"
            style={{ backgroundColor: '#198754', border: 'none', fontSize: '16px' }}
            onClick={() => setShowEntryModal(true)}
          >
            🚪 New Visitor
          </Button>
        </Col>
        <Col xs={6}>
          <Button
            size="lg"
            variant="outline-dark"
            className="w-100 py-3 fw-bold rounded-4 shadow-sm"
            style={{ fontSize: '16px' }}
            disabled
          >
            👷 Staff Movement
          </Button>
        </Col>
      </Row>

      {/* Active Visitors */}
      <h5 className="fw-bold mb-3" style={{ color: '#1a1a2e' }}>
        📋 Currently Inside ({activeVisitors.length})
      </h5>

      {activeVisitors.length === 0 ? (
        <Card className="border-0 shadow-sm rounded-4 text-center py-5">
          <Card.Body>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏠</div>
            <h5 className="text-muted">No visitors inside</h5>
            <p className="text-muted mb-0">All clear! Tap "New Visitor" to log an entry.</p>
          </Card.Body>
        </Card>
      ) : (
        <ListGroup className="shadow-sm rounded-4 overflow-hidden">
          {activeVisitors.map((visitor) => (
            <ListGroup.Item
              key={visitor._id}
              className="border-start-0 border-end-0 px-3 py-3"
            >
              <div className="d-flex justify-content-between align-items-start">
                {/* Visitor Info */}
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h6 className="fw-bold mb-0">{visitor.visitorName}</h6>
                    <Badge bg={getPurposeColor(visitor.purpose)} className="text-uppercase" style={{ fontSize: '10px' }}>
                      {visitor.purpose}
                    </Badge>
                  </div>
                  <div className="text-muted" style={{ fontSize: '13px' }}>
                    {visitor.visitorPhone && <span>📞 {visitor.visitorPhone} · </span>}
                    {visitor.flatId && (
                      <span>🏠 {visitor.flatId.wing || ''}-{visitor.flatId.flatNumber || ''} · </span>
                    )}
                    {visitor.vehicleNumber && <span>🚗 {visitor.vehicleNumber} · </span>}
                    <span>⏱ {getTimeSince(visitor.createdAt)}</span>
                  </div>
                </div>

                {/* Check Out Button */}
                <Button
                  variant="danger"
                  size="lg"
                  className="rounded-3 fw-bold flex-shrink-0 ms-2"
                  onClick={() => handleCheckOut(visitor._id)}
                  disabled={checkingOut === visitor._id}
                  style={{ minWidth: '110px' }}
                >
                  {checkingOut === visitor._id ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    '👋 Check Out'
                  )}
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {/* Visitor Entry Modal */}
      <VisitorEntryModal
        show={showEntryModal}
        handleClose={() => setShowEntryModal(false)}
        refreshVisitors={fetchData}
        flats={flats}
      />
    </Container>
  );
};

export default GateDashboard;
