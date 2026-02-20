import { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Spinner, Alert, Card, Modal, Form, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const NocRequests = () => {
  const { user } = useAuth();
  const isAdmin = user?.userType === 'society_admin' || user?.userType === 'super_admin';
  const isResident = user?.userType === 'resident';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Request Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState('sale');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/facilities/noc');
      if (data.success) setRequests(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load NOC requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const resetForm = () => {
    setRequestType('sale');
    setBuyerName('');
    setBuyerPhone('');
    setReason('');
    setFormError('');
  };

  const handleRequestNoc = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const { data } = await api.post('/facilities/noc', {
        requestType,
        buyerName,
        buyerPhone,
        reason,
      });

      if (data.success) {
        resetForm();
        setShowRequestModal(false);
        setSuccessMsg('NOC request submitted successfully!');
        fetchRequests();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit NOC request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const { data } = await api.put(`/facilities/noc/${requestId}`, { status: newStatus });
      if (data.success) {
        setSuccessMsg(`NOC request ${newStatus}.`);
        fetchRequests();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update NOC status.');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { bg: 'warning', label: '● Pending Review' },
      approved: { bg: 'success', label: '✓ Approved' },
      rejected: { bg: 'danger', label: '✕ Rejected' },
      issued: { bg: 'primary', label: '📜 NOC Issued' },
    };
    const s = map[status] || { bg: 'secondary', label: status };
    return <Badge bg={s.bg} className="px-2 py-1">{s.label}</Badge>;
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" style={{ color: '#6C63FF' }} />
      </div>
    );
  }

  return (
    <Container fluid className="p-0">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>📜 NOC Requests (Sale / Rent)</h3>
          <p className="text-muted mb-0">
            {requests.length} requests ·{' '}
            <span className="text-warning fw-semibold">{pendingCount} pending</span>
          </p>
        </div>
        {isResident && (
          <Button
            onClick={() => setShowRequestModal(true)}
            style={{ backgroundColor: '#6C63FF', border: 'none' }}
          >
            + Request NOC
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {successMsg && <Alert variant="success" dismissible onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {/* Requests Table */}
      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          {requests.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📜</div>
              <h5>No NOC requests</h5>
              <p>{isResident ? 'Click "Request NOC" to apply for a No-Objection Certificate.' : 'No pending NOC requests from residents.'}</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  {isAdmin && <th>Requested By</th>}
                  <th>Type</th>
                  <th>Buyer / Tenant</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Date</th>
                  {isAdmin && <th style={{ width: '200px' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map((req, index) => (
                  <tr key={req._id}>
                    <td className="text-muted">{index + 1}</td>
                    {isAdmin && (
                      <td className="fw-semibold" style={{ fontSize: '13px' }}>
                        {req.requestedBy?.firstName || '—'} {req.requestedBy?.lastName || ''}
                      </td>
                    )}
                    <td>
                      <Badge bg={req.requestType === 'sale' ? 'primary' : 'info'} className="text-uppercase">
                        {req.requestType === 'sale' ? '🏷️ Sale' : '🏠 Rent'}
                      </Badge>
                    </td>
                    <td>{req.buyerName || '—'}</td>
                    <td className="text-muted" style={{ fontSize: '13px' }}>{req.buyerPhone || '—'}</td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td className="text-muted" style={{ fontSize: '13px' }}>
                      {new Date(req.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    {isAdmin && (
                      <td>
                        {req.status === 'pending' ? (
                          <div className="d-flex gap-1">
                            <Button
                              variant="success"
                              size="sm"
                              className="rounded-pill px-3"
                              onClick={() => handleStatusUpdate(req._id, 'approved')}
                            >
                              ✓ Approve
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="rounded-pill px-3"
                              onClick={() => handleStatusUpdate(req._id, 'rejected')}
                            >
                              ✕ Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '13px' }}>—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Request NOC Modal (Resident Only) */}
      <Modal show={showRequestModal} onHide={() => { setShowRequestModal(false); resetForm(); }} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#6C63FF', color: '#fff' }}>
          <Modal.Title>📜 Request NOC</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger" dismissible onClose={() => setFormError('')}>{formError}</Alert>}
          <Form onSubmit={handleRequestNoc}>
            <Form.Group className="mb-3">
              <Form.Label>Request Type *</Form.Label>
              <Form.Select value={requestType} onChange={(e) => setRequestType(e.target.value)} required>
                <option value="sale">🏷️ Sale — Selling my flat</option>
                <option value="rent">🏠 Rent — Renting my flat</option>
              </Form.Select>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Buyer / Tenant Name *</Form.Label>
                  <Form.Control
                    placeholder="e.g., Priya Mehta"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    placeholder="9876543210"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Reason / Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Any additional details..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => { setShowRequestModal(false); resetForm(); }}>Cancel</Button>
              <Button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: '#6C63FF', border: 'none' }}
              >
                {submitting ? <Spinner animation="border" size="sm" /> : '✦ Submit Request'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default NocRequests;
