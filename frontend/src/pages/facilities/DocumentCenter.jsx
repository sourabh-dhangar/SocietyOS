import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Modal, Form, ListGroup, Nav } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DocumentCenter = () => {
  const { user } = useAuth();
  const isAdmin = user?.userType === 'society_admin' || user?.userType === 'super_admin';

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [viewMode, setViewMode] = useState('docs'); // 'docs' or 'gallery'

  // Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('certificate');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/facilities/documents');
      if (data.success) setDocs(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const resetForm = () => {
    setTitle('');
    setType('certificate');
    setFileUrl('');
    setFormError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const { data } = await api.post('/facilities/documents', { title, type, fileUrl });
      if (data.success) {
        resetForm();
        setShowUploadModal(false);
        setSuccessMsg('Document uploaded successfully!');
        fetchDocs();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeBadge = (t) => {
    const map = {
      certificate: { bg: 'primary', icon: '📜' },
      gallery_image: { bg: 'success', icon: '🖼️' },
      notice: { bg: 'info', icon: '📋' },
      report: { bg: 'warning', icon: '📊' },
      other: { bg: 'secondary', icon: '📄' },
    };
    const s = map[t] || { bg: 'secondary', icon: '📄' };
    return <Badge bg={s.bg} className="text-uppercase">{s.icon} {t?.replace('_', ' ')}</Badge>;
  };

  const filteredDocs = viewMode === 'gallery'
    ? docs.filter((d) => d.type === 'gallery_image')
    : docs.filter((d) => d.type !== 'gallery_image');

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
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>📄 Document & Media Center</h3>
          <p className="text-muted mb-0">{docs.length} documents uploaded</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowUploadModal(true)}
            style={{ backgroundColor: '#6C63FF', border: 'none' }}
          >
            + Upload Document
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {successMsg && <Alert variant="success" dismissible onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {/* View Toggle */}
      <Nav variant="pills" className="mb-4">
        <Nav.Item>
          <Nav.Link
            active={viewMode === 'docs'}
            onClick={() => setViewMode('docs')}
            style={viewMode === 'docs' ? { backgroundColor: '#6C63FF' } : { cursor: 'pointer' }}
          >
            📋 Documents
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={viewMode === 'gallery'}
            onClick={() => setViewMode('gallery')}
            style={viewMode === 'gallery' ? { backgroundColor: '#6C63FF' } : { cursor: 'pointer' }}
          >
            🖼️ Gallery
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Content */}
      {filteredDocs.length === 0 ? (
        <Card className="border-0 shadow-sm rounded-4 text-center py-5">
          <Card.Body>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>
              {viewMode === 'gallery' ? '🖼️' : '📭'}
            </div>
            <h5 className="text-muted">
              {viewMode === 'gallery' ? 'No gallery images yet' : 'No documents uploaded yet'}
            </h5>
            <p className="text-muted mb-0">
              {isAdmin ? 'Click "Upload Document" to add files.' : 'Check back later.'}
            </p>
          </Card.Body>
        </Card>
      ) : viewMode === 'gallery' ? (
        /* Gallery Grid */
        <Row className="g-4">
          {filteredDocs.map((doc) => (
            <Col xs={6} md={4} lg={3} key={doc._id}>
              <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div
                  style={{
                    height: '180px',
                    backgroundColor: '#f0f0f0',
                    backgroundImage: doc.fileUrl ? `url(${doc.fileUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!doc.fileUrl && <span style={{ fontSize: '48px' }}>🖼️</span>}
                </div>
                <Card.Body className="p-3">
                  <p className="fw-semibold mb-1" style={{ fontSize: '14px' }}>{doc.title}</p>
                  <small className="text-muted">
                    {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </small>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        /* Documents List */
        <Card className="border-0 shadow-sm rounded-4">
          <Card.Body className="p-0">
            <ListGroup variant="flush">
              {filteredDocs.map((doc) => (
                <ListGroup.Item key={doc._id} className="d-flex justify-content-between align-items-center px-4 py-3">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <h6 className="fw-semibold mb-0">{doc.title}</h6>
                      {getTypeBadge(doc.type)}
                    </div>
                    <small className="text-muted">
                      Uploaded {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {doc.uploadedBy && ` by ${doc.uploadedBy.firstName || 'Admin'}`}
                    </small>
                  </div>
                  {doc.fileUrl && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="rounded-pill px-3"
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      🔗 View
                    </Button>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
      )}

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => { setShowUploadModal(false); resetForm(); }} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#6C63FF', color: '#fff' }}>
          <Modal.Title>📄 Upload Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger" dismissible onClose={() => setFormError('')}>{formError}</Alert>}
          <Form onSubmit={handleUpload}>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                placeholder="e.g., Society Registration Certificate"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type *</Form.Label>
              <Form.Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="certificate">📜 Certificate</option>
                <option value="gallery_image">🖼️ Gallery Image</option>
                <option value="report">📊 Report</option>
                <option value="notice">📋 Notice</option>
                <option value="other">📄 Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>File URL *</Form.Label>
              <Form.Control
                placeholder="https://drive.google.com/... or uploaded URL"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                required
              />
              <Form.Text className="text-muted">Paste a link to the document or image</Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => { setShowUploadModal(false); resetForm(); }}>Cancel</Button>
              <Button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: '#6C63FF', border: 'none' }}
              >
                {submitting ? <Spinner animation="border" size="sm" /> : '✦ Upload'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default DocumentCenter;
