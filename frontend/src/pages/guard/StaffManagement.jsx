import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, ListGroup, Modal, Form } from 'react-bootstrap';
import api from '../../services/api';

const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Registration Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(null);
  
  const [formData, setFormData] = useState({
    staffName: '',
    staffType: 'Society_Staff',
  });

  const staffTypes = ['Society_Staff', 'Maid', 'Driver', 'Plumber', 'Electrician', 'Other'];

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/security/staff');
      if (data.success) {
        setStaffList(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch staff list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleToggleStatus = async (staffId) => {
    setToggling(staffId);
    setError('');
    try {
      const { data } = await api.post('/security/staff/movement', { staffId });
      if (data.success) {
        fetchStaff();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update staff status.');
    } finally {
      setToggling(null);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      // Create new staff by passing name and type without ID (triggers creation in backend)
      const { data } = await api.post('/security/staff/movement', formData);
      if (data.success) {
        setShowModal(false);
        setFormData({ staffName: '', staffType: 'Society_Staff' });
        fetchStaff();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register staff.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeSince = (dateStr) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ${mins % 60}m ago`;
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  return (
    <Container fluid className="p-0">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <Button 
            variant="link" 
            className="text-decoration-none ps-0 mb-2 d-inline-flex align-items-center"
            onClick={() => window.history.back()}
          >
            ← Back to Gate
          </Button>
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>👷 Staff Attendance</h3>
          <p className="text-muted mb-0">Track entry/exit for maids, drivers, and society staff</p>
        </div>
        <Button 
          style={{ backgroundColor: '#198754', border: 'none' }}
          onClick={() => setShowModal(true)}
        >
          + Register New Staff
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card className="border-0 shadow-sm rounded-4">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: '#198754' }} />
          </div>
        ) : staffList.length === 0 ? (
          <Card.Body className="text-center py-5">
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
            <h5 className="text-muted">No staff registered</h5>
            <p className="text-muted mb-0">Register maids, drivers, and other staff to track their attendance.</p>
          </Card.Body>
        ) : (
          <ListGroup variant="flush" className="rounded-4">
            {staffList.map((staff) => (
              <ListGroup.Item key={staff._id} className="p-3 py-4 border-bottom">
                <Row className="align-items-center">
                  <Col xs={12} md={7} className="mb-3 mb-md-0">
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold bg-secondary"
                        style={{ width: '48px', height: '48px', fontSize: '20px' }}
                      >
                        {staff.staffName?.[0] || 'S'}
                      </div>
                      <div>
                        <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                          {staff.staffName}
                          <Badge bg="light" text="dark" className="border">
                            {staff.staffType}
                          </Badge>
                        </h5>
                        <div className="text-muted" style={{ fontSize: '13px' }}>
                          <span className="me-3">
                            <strong className="text-dark">Last In:</strong> {getTimeSince(staff.lastEntry)}
                          </span>
                          <span>
                            <strong className="text-dark">Last Out:</strong> {getTimeSince(staff.lastExit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col xs={12} md={5} className="text-md-end">
                    {staff.status === 'inside' ? (
                      <Button
                        variant="danger"
                        size="lg"
                        className="rounded-pill px-4 fw-bold shadow-sm w-100"
                        style={{ maxWidth: '200px' }}
                        onClick={() => handleToggleStatus(staff._id)}
                        disabled={toggling === staff._id}
                      >
                        {toggling === staff._id ? <Spinner size="sm"/> : '👋 Check Out'}
                      </Button>
                    ) : (
                      <Button
                        variant="success"
                        size="lg"
                        className="rounded-pill px-4 fw-bold shadow-sm w-100"
                        style={{ maxWidth: '200px' }}
                        onClick={() => handleToggleStatus(staff._id)}
                        disabled={toggling === staff._id}
                      >
                        {toggling === staff._id ? <Spinner size="sm"/> : '✅ Check In'}
                      </Button>
                    )}
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card>

      {/* Register Staff Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Register New Staff</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleRegister}>
            <Form.Group className="mb-3">
              <Form.Label>Staff Name <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g. Ramesh Kumar"
                value={formData.staffName}
                onChange={(e) => setFormData({...formData, staffName: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Type / Role</Form.Label>
              <Form.Select 
                value={formData.staffType}
                onChange={(e) => setFormData({...formData, staffType: e.target.value})}
              >
                {staffTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="success" type="submit" disabled={submitting}>
                 {submitting ? <Spinner size="sm"/> : 'Register & Check-In'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

    </Container>
  );
};

export default StaffManagement;
