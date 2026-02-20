import { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Spinner, Alert, Card, Modal, Form, Row, Col } from 'react-bootstrap';
import api from '../../services/api';

const ManageFlats = () => {
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Flat Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [wing, setWing] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [sizeSqFt, setSizeSqFt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchFlats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/core/flats');
      if (data.success) {
        setFlats(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load flats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlats();
  }, []);

  const handleAddFlat = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const { data } = await api.post('/core/flats', {
        wing,
        flatNumber,
        sizeSqFt: Number(sizeSqFt) || 0,
      });

      if (data.success) {
        setShowAddModal(false);
        setWing('');
        setFlatNumber('');
        setSizeSqFt('');
        fetchFlats();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add flat.');
    } finally {
      setSubmitting(false);
    }
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>🏠 Manage Flats & Units</h3>
          <p className="text-muted mb-0">{flats.length} flats registered</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          style={{ backgroundColor: '#6C63FF', border: 'none' }}
        >
          + Add Flat
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Flat Table */}
      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          {flats.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <h5>No flats added yet</h5>
              <p>Click "Add Flat" to register your society's units.</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Wing</th>
                  <th>Flat No</th>
                  <th>Area (Sq.Ft)</th>
                  <th>Status</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {flats.map((flat, index) => (
                  <tr key={flat._id}>
                    <td className="text-muted">{index + 1}</td>
                    <td className="fw-semibold">{flat.wing}</td>
                    <td>{flat.flatNumber}</td>
                    <td>{flat.sizeSqFt || '—'}</td>
                    <td>
                      <Badge bg={flat.owner ? 'success' : 'warning'} className="px-2 py-1">
                        {flat.owner ? '● Occupied' : '● Vacant'}
                      </Badge>
                    </td>
                    <td>
                      {flat.owner
                        ? `${flat.owner.firstName || ''} ${flat.owner.lastName || ''}`
                        : <span className="text-muted">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add Flat Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#6C63FF', color: '#fff' }}>
          <Modal.Title>🏠 Add New Flat</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger" dismissible onClose={() => setFormError('')}>{formError}</Alert>}
          <Form onSubmit={handleAddFlat}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Wing</Form.Label>
                  <Form.Control
                    placeholder="e.g., A, B, C"
                    value={wing}
                    onChange={(e) => setWing(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Flat Number</Form.Label>
                  <Form.Control
                    placeholder="e.g., 101, 202"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Area (Sq.Ft)</Form.Label>
              <Form.Control
                type="number"
                placeholder="e.g., 850"
                value={sizeSqFt}
                onChange={(e) => setSizeSqFt(e.target.value)}
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: '#6C63FF', border: 'none' }}
              >
                {submitting ? <Spinner animation="border" size="sm" /> : '✦ Add Flat'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ManageFlats;
