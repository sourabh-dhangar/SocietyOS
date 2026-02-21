import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import api from '../../services/api';
import AddSocietyModal from '../../components/shared/AddSocietyModal';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchSocieties = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/core/societies');
      if (data.success) {
        setSocieties(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch societies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, []);

  // Computed metrics
  const totalSocieties = societies.length;
  const activeSocieties = societies.filter((s) => s.isActive).length;
  const inactiveSocieties = totalSocieties - activeSocieties;
  const planBreakdown = {
    basic: societies.filter((s) => s.subscriptionPlan === 'basic').length,
    premium: societies.filter((s) => s.subscriptionPlan === 'premium').length,
    enterprise: societies.filter((s) => s.subscriptionPlan === 'enterprise').length,
  };

  const getPlanBadge = (plan) => {
    const colors = { basic: 'secondary', premium: 'primary', enterprise: 'success' };
    return <Badge bg={colors[plan] || 'secondary'}>{plan?.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" style={{ color: '#6C63FF' }} />
      </Container>
    );
  }

  return (
    <Container fluid className="p-0">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-0" style={{ color: '#6C63FF' }}>✦ Super Admin Dashboard</h3>
          <p className="text-muted mb-0">Nakshatra Platform Overview</p>
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Metric Cards */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <h6 className="text-muted">Total Societies</h6>
              <h2 className="fw-bold" style={{ color: '#6C63FF' }}>{totalSocieties}</h2>
              <small className="text-success">{activeSocieties} Active</small>
              {inactiveSocieties > 0 && <small className="text-danger ms-2">{inactiveSocieties} Inactive</small>}
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <h6 className="text-muted">Plan Distribution</h6>
              <div className="d-flex justify-content-center gap-3 mt-2">
                <div><Badge bg="secondary">{planBreakdown.basic}</Badge> Basic</div>
                <div><Badge bg="primary">{planBreakdown.premium}</Badge> Premium</div>
                <div><Badge bg="success">{planBreakdown.enterprise}</Badge> Enterprise</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <h6 className="text-muted">Platform Status</h6>
              <h4 className="mt-2">
                <Badge bg="success" className="px-3 py-2">🟢 Online</Badge>
              </h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card
            className="border-0 shadow-sm h-100"
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={() => navigate('/societies')}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Card.Body className="text-center d-flex flex-column align-items-center justify-content-center">
              <h6 className="text-muted">Quick Actions</h6>
              <Button
                size="sm"
                className="mt-1"
                style={{ backgroundColor: '#6C63FF', border: 'none' }}
              >
                🏢 Manage Societies →
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Societies Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
          <h5 className="mb-0 fw-bold">🏢 Recently Onboarded</h5>
          <Button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: '#6C63FF', border: 'none' }}
          >
            + Add New Society
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          {societies.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <h5>No societies onboarded yet</h5>
              <p>Click "Add New Society" to get started.</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Society Name</th>
                  <th>City</th>
                  <th>Admin Email</th>
                  <th>Plan</th>
                  <th>Features</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {societies.slice(0, 5).map((society, index) => (
                  <tr key={society._id}>
                    <td>{index + 1}</td>
                    <td className="fw-semibold">{society.name}</td>
                    <td>{society.address?.city || '—'}</td>
                    <td className="text-muted" style={{ fontSize: '13px' }}>{society.adminEmail || '—'}</td>
                    <td>{getPlanBadge(society.subscriptionPlan)}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '140px' }}>
                        {society.features?.hasFinance !== false && <Badge bg="info" text="dark" className="bg-opacity-25 border border-info fw-normal">Finance</Badge>}
                        {society.features?.hasSecurity !== false && <Badge bg="info" text="dark" className="bg-opacity-25 border border-info fw-normal">Security</Badge>}
                        {society.features?.hasOperations !== false && <Badge bg="info" text="dark" className="bg-opacity-25 border border-info fw-normal">Operations</Badge>}
                        {society.features?.hasFacilities !== false && <Badge bg="info" text="dark" className="bg-opacity-25 border border-info fw-normal">Facilities</Badge>}
                      </div>
                    </td>
                    <td>
                      <Badge bg={society.isActive ? 'success' : 'danger'}>
                        {society.isActive ? '● Active' : '● Inactive'}
                      </Badge>
                    </td>
                    <td className="text-muted" style={{ fontSize: '13px' }}>
                      {new Date(society.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          {societies.length > 5 && (
            <div className="text-center py-3 border-top">
              <Button
                variant="link"
                style={{ color: '#6C63FF' }}
                onClick={() => navigate('/societies')}
              >
                View all {societies.length} societies →
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Society Modal */}
      <AddSocietyModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        refreshData={fetchSocieties}
      />
    </Container>
  );
};

export default SuperAdminDashboard;
