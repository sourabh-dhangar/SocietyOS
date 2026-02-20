import { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Spinner, Alert, Card, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Helpdesk = () => {
  const { user } = useAuth();
  const isAdmin = user?.userType === 'society_admin' || user?.userType === 'super_admin';
  const isResident = user?.userType === 'resident';

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Raise Complaint Modal
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState('plumbing');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/ops/complaints');
      if (data.success) setComplaints(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const resetForm = () => {
    setCategory('plumbing');
    setDescription('');
    setFormError('');
  };

  const handleRaiseComplaint = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const { data } = await api.post('/ops/complaints', { category, description });
      if (data.success) {
        resetForm();
        setShowModal(false);
        setSuccessMsg('Complaint raised successfully!');
        fetchComplaints();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to raise complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      const { data } = await api.put(`/ops/complaints/${complaintId}`, { status: newStatus });
      if (data.success) {
        setSuccessMsg(`Complaint status updated to "${newStatus}".`);
        fetchComplaints();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      open: { bg: 'warning', label: '● Open' },
      in_progress: { bg: 'info', label: '◷ In Progress' },
      resolved: { bg: 'success', label: '✓ Resolved' },
      closed: { bg: 'secondary', label: '✕ Closed' },
    };
    const s = map[status] || { bg: 'secondary', label: status };
    return <Badge bg={s.bg} className="px-2 py-1">{s.label}</Badge>;
  };

  const getCategoryBadge = (cat) => {
    const map = {
      plumbing: { bg: 'primary', icon: '🔧' },
      electrical: { bg: 'warning', icon: '⚡' },
      civil: { bg: 'dark', icon: '🏗️' },
      housekeeping: { bg: 'success', icon: '🧹' },
      security: { bg: 'danger', icon: '🔒' },
      parking: { bg: 'info', icon: '🅿️' },
      other: { bg: 'secondary', icon: '📝' },
    };
    const c = map[cat] || { bg: 'secondary', icon: '📝' };
    return <Badge bg={c.bg} className="text-uppercase">{c.icon} {cat}</Badge>;
  };

  // Summary
  const openCount = complaints.filter((c) => c.status === 'open').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress').length;

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
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>🔧 Helpdesk & Complaints</h3>
          <p className="text-muted mb-0">
            {complaints.length} total · <span className="text-warning fw-semibold">{openCount} open</span> · <span className="text-info fw-semibold">{inProgressCount} in progress</span>
          </p>
        </div>
        {isResident && (
          <Button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: '#dc3545', border: 'none' }}
          >
            + Raise Complaint
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {successMsg && <Alert variant="success" dismissible onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {/* Complaints Table */}
      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          {complaints.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <h5>No complaints</h5>
              <p>{isResident ? 'Click "Raise Complaint" if you have any issues.' : 'All clear! No pending issues.'}</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Category</th>
                  <th>Description</th>
                  {isAdmin && <th>Raised By</th>}
                  <th>Status</th>
                  <th>Date</th>
                  {isAdmin && <th style={{ width: '160px' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {complaints.map((c, index) => (
                  <tr key={c._id}>
                    <td className="text-muted">{index + 1}</td>
                    <td>{getCategoryBadge(c.category)}</td>
                    <td style={{ maxWidth: '300px', fontSize: '14px' }}>
                      {c.description?.length > 100 ? `${c.description.substring(0, 100)}...` : c.description}
                    </td>
                    {isAdmin && (
                      <td style={{ fontSize: '13px' }}>
                        {c.raisedBy?.firstName || '—'} {c.raisedBy?.lastName || ''}
                      </td>
                    )}
                    <td>{getStatusBadge(c.status)}</td>
                    <td className="text-muted" style={{ fontSize: '13px' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </td>
                    {isAdmin && (
                      <td>
                        <Form.Select
                          size="sm"
                          value={c.status}
                          onChange={(e) => handleStatusUpdate(c._id, e.target.value)}
                          className="rounded-pill"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </Form.Select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Raise Complaint Modal (Resident Only) */}
      <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#dc3545', color: '#fff' }}>
          <Modal.Title>🔧 Raise a Complaint</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger" dismissible onClose={() => setFormError('')}>{formError}</Alert>}
          <Form onSubmit={handleRaiseComplaint}>
            <Form.Group className="mb-3">
              <Form.Label>Category *</Form.Label>
              <Form.Select value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="plumbing">🔧 Plumbing</option>
                <option value="electrical">⚡ Electrical</option>
                <option value="civil">🏗️ Civil</option>
                <option value="housekeeping">🧹 Housekeeping</option>
                <option value="security">🔒 Security</option>
                <option value="parking">🅿️ Parking</option>
                <option value="other">📝 Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
              <Button
                type="submit"
                variant="danger"
                disabled={submitting}
              >
                {submitting ? <Spinner animation="border" size="sm" /> : '✦ Submit Complaint'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Helpdesk;
