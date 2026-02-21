import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const MyVisitors = () => {
  const { user } = useAuth();
  
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState(null);

  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    purpose: 'Guest',
    vehicleNumber: '',
    expectedEntryDate: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
  });

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      // Let's assume residents can use the same getActiveVisitors if it filters by their flat, 
      // but the backend `getActiveVisitors` filters by societyId. 
      // Actually, since there's no dedicated 'getMyVisitors' endpoint in gateController,
      // we can fetch active visitors and filter by user.flatId, 
      // OR we can just rely on the existing getActiveVisitors which we might need to update later.
      // For now, let's fetch active visitors and filter client-side if flatId matches.
      const { data } = await api.get('/security/visitors/active');
      if (data.success) {
        // Filter those belonging to this resident's flat
        const myLogs = data.data.filter(v => v.flatId?._id === user?.flatId);
        setVisitors(myLogs);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load visitors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessCode(null);
    try {
      const { data } = await api.post('/security/visitors/pre-approve', {
        ...formData,
        flatId: user?.flatId
      });
      if (data.success) {
        setSuccessCode(data.data.passCode);
        fetchVisitors();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to pre-approve visitor.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status, isPreApproved, passCode) => {
    if (status === 'checked_in') return <Badge bg="success">Inside</Badge>;
    if (status === 'checked_out') return <Badge bg="secondary">Left</Badge>;
    if (status === 'approved' && isPreApproved && passCode) return <Badge bg="primary">Awaiting Arrival</Badge>;
    if (status === 'pending_approval') return <Badge bg="warning" text="dark">Awaiting Approval</Badge>;
    return <Badge bg="secondary">{status}</Badge>;
  };

  return (
    <Container fluid className="p-0">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>🤝 My Visitors</h3>
          <p className="text-muted mb-0">Manage and pre-approve your upcoming guests</p>
        </div>
        <Button 
          style={{ backgroundColor: '#6C63FF', border: 'none' }}
          onClick={() => {
            setShowModal(true);
            setSuccessCode(null);
            setFormData({
              visitorName: '',
              visitorPhone: '',
              purpose: 'Guest',
              vehicleNumber: '',
              expectedEntryDate: new Date().toISOString().slice(0, 16),
            });
          }}
        >
          + Pre-Approve Visitor
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Row className="g-4">
        {loading ? (
          <Col xs={12} className="text-center py-5">
            <Spinner animation="border" style={{ color: '#6C63FF' }} />
          </Col>
        ) : visitors.length === 0 ? (
          <Col xs={12}>
            <Card className="border-0 shadow-sm rounded-4 text-center py-5">
              <Card.Body>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                <h5 className="text-muted">No active visitors</h5>
                <p className="text-muted mb-0">Pre-approve a visitor to share an entry code.</p>
              </Card.Body>
            </Card>
          </Col>
        ) : (
          visitors.map(visitor => (
            <Col md={6} lg={4} key={visitor._id}>
              <Card className="border-0 shadow-sm rounded-4 h-100 position-relative overflow-hidden">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="fw-bold mb-0">{visitor.visitorName}</h5>
                    {getStatusBadge(visitor.status, visitor.isPreApproved, visitor.passCode)}
                  </div>
                  
                  <div className="mb-3 text-muted" style={{ fontSize: '14px' }}>
                    {visitor.visitorPhone && <div>📞 {visitor.visitorPhone}</div>}
                    <div>🎯 {visitor.purpose}</div>
                    {visitor.vehicleNumber && <div>🚗 {visitor.vehicleNumber}</div>}
                    {visitor.expectedEntryDate && (
                      <div>🕒 Expected: {new Date(visitor.expectedEntryDate).toLocaleString('en-IN', {
                         dateStyle: 'medium', timeStyle: 'short' 
                      })}</div>
                    )}
                  </div>

                  {visitor.status === 'approved' && visitor.isPreApproved && visitor.passCode && (
                    <div className="p-3 bg-light rounded-3 text-center mt-auto border border-primary border-opacity-25">
                      <p className="text-muted mb-1" style={{ fontSize: '12px', fontWeight: 'bold' }}>SHARE THIS CODE WITH VISITOR</p>
                      <h2 className="fw-bold mb-0" style={{ letterSpacing: '8px', color: '#6C63FF' }}>
                        {visitor.passCode}
                      </h2>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Pre-Approve Modal */}
      <Modal show={showModal} onHide={() => { setShowModal(false); fetchVisitors(); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Pre-Approve Visitor</Modal.Title>
        </Modal.Header>
        <Modal.Body className={successCode ? 'text-center py-5' : ''}>
          {successCode ? (
            <div>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <h4 className="fw-bold text-success mb-2">Code Generated!</h4>
              <p className="text-muted mb-4">Share this 6-digit code with your visitor. They can show it to the guard for instant entry.</p>
              
              <div className="p-4 bg-light rounded-4 d-inline-block shadow-sm">
                <h1 className="fw-bold mb-0" style={{ letterSpacing: '12px', color: '#1a1a2e', fontSize: '48px' }}>
                  {successCode}
                </h1>
              </div>
              
              <div className="mt-4">
                <Button variant="outline-secondary" onClick={() => { setShowModal(false); fetchVisitors(); }}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Visitor Name <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Enter full name"
                  value={formData.visitorName}
                  onChange={(e) => setFormData({...formData, visitorName: e.target.value})}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Phone Number (Optional)</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Enter phone number"
                  value={formData.visitorPhone}
                  onChange={(e) => setFormData({...formData, visitorPhone: e.target.value})}
                />
              </Form.Group>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Purpose</Form.Label>
                    <Form.Select 
                      value={formData.purpose}
                      onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                    >
                      <option value="Guest">Guest</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Service">Service (Plumber, etc.)</option>
                      <option value="Cab">Cab/Taxi</option>
                      <option value="Other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Vehicle Number</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="e.g. MH12AB1234"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value.toUpperCase()})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-4">
                <Form.Label>Expected Entry <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="datetime-local" 
                  value={formData.expectedEntryDate}
                  onChange={(e) => setFormData({...formData, expectedEntryDate: e.target.value})}
                  required
                />
              </Form.Group>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={submitting} style={{ backgroundColor: '#6C63FF', border: 'none' }}>
                  {submitting ? <Spinner size="sm"/> : 'Generate Code'}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

    </Container>
  );
};

export default MyVisitors;
