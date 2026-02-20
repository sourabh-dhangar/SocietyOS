import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const NoticeBoard = () => {
  const { user } = useAuth();
  const isAdmin = user?.userType === 'society_admin' || user?.userType === 'super_admin';

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Notice Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/ops/notices');
      if (data.success) setNotices(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setType('general');
    setFormError('');
  };

  const handleAddNotice = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const { data } = await api.post('/ops/notices', { title, content, type });
      if (data.success) {
        resetForm();
        setShowModal(false);
        fetchNotices();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add notice.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeBadge = (t) => {
    const map = {
      general: { bg: 'info', icon: '📋' },
      alert: { bg: 'danger', icon: '🚨' },
      meeting: { bg: 'primary', icon: '📅' },
      event: { bg: 'success', icon: '🎉' },
    };
    const s = map[t] || { bg: 'secondary', icon: '📌' };
    return <Badge bg={s.bg} className="text-uppercase">{s.icon} {t}</Badge>;
  };

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
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>📢 Digital Notice Board</h3>
          <p className="text-muted mb-0">{notices.length} notices published</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: '#6C63FF', border: 'none' }}
          >
            + Add New Notice
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Notice Cards Grid */}
      {notices.length === 0 ? (
        <Card className="border-0 shadow-sm rounded-4 text-center py-5">
          <Card.Body>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
            <h5 className="text-muted">No notices yet</h5>
            <p className="text-muted mb-0">
              {isAdmin ? 'Click "Add New Notice" to publish one.' : 'Check back later for updates.'}
            </p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {notices.map((notice) => (
            <Col md={6} lg={4} key={notice._id}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="d-flex flex-column p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    {getTypeBadge(notice.type)}
                    {notice.isPinned && (
                      <Badge bg="dark" className="ms-1">📌 Pinned</Badge>
                    )}
                  </div>
                  <h5 className="fw-bold mt-2 mb-2">{notice.title}</h5>
                  <p className="text-muted flex-grow-1" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    {notice.content?.length > 180
                      ? `${notice.content.substring(0, 180)}...`
                      : notice.content
                    }
                  </p>
                  <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                    <small className="text-muted">
                      {new Date(notice.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </small>
                    <small className="text-muted">
                      {notice.createdBy?.firstName || 'Admin'}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Add Notice Modal */}
      <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#6C63FF', color: '#fff' }}>
          <Modal.Title>📢 Add New Notice</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger" dismissible onClose={() => setFormError('')}>{formError}</Alert>}
          <Form onSubmit={handleAddNotice}>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                placeholder="e.g., Water Supply Maintenance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Content *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Notice details..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="general">📋 General</option>
                <option value="alert">🚨 Alert</option>
                <option value="meeting">📅 Meeting</option>
                <option value="event">🎉 Event</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
              <Button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: '#6C63FF', border: 'none' }}
              >
                {submitting ? <Spinner animation="border" size="sm" /> : '✦ Publish Notice'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default NoticeBoard;
