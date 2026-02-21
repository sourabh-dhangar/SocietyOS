import { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import api from '../../services/api';

const EditSocietyModal = ({ show, handleClose, refreshData, society }) => {
  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    city: '',
    state: '',
    contactEmail: '',
    contactPhone: '',
    subscriptionPlan: 'basic',
    features: {
      finance: true,
      security: true,
      operations: true,
      facilities: true,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill form when society changes
  useEffect(() => {
    if (society) {
      setFormData({
        name: society.name || '',
        registrationNumber: society.registrationNumber || '',
        city: society.address?.city || '',
        state: society.address?.state || '',
        contactEmail: society.contactEmail || '',
        contactPhone: society.contactPhone || '',
        subscriptionPlan: society.subscriptionPlan || 'basic',
        features: society.features || {
          finance: true,
          security: true,
          operations: true,
          facilities: true,
        },
      });
    }
  }, [society]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFeatureToggle = (feature) => {
    setFormData({
      ...formData,
      features: {
        ...formData.features,
        [feature]: !formData.features[feature],
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        registrationNumber: formData.registrationNumber,
        address: {
          city: formData.city,
          state: formData.state,
        },
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        subscriptionPlan: formData.subscriptionPlan,
        features: formData.features,
      };

      const { data } = await api.put(`/core/society/${society._id}`, payload);

      if (data.success) {
        refreshData();
        handleClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update society.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton style={{ backgroundColor: '#0d6efd', color: '#fff' }}>
        <Modal.Title>✏️ Edit Society</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Society Name</Form.Label>
                <Form.Control
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Registration Number</Form.Label>
                <Form.Control
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>City</Form.Label>
                <Form.Control
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>State</Form.Label>
                <Form.Control
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Contact Email</Form.Label>
                <Form.Control
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Contact Phone</Form.Label>
                <Form.Control
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-4">
            <Form.Label>Subscription Plan</Form.Label>
            <Form.Select name="subscriptionPlan" value={formData.subscriptionPlan} onChange={handleChange}>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </Form.Select>
          </Form.Group>

          {/* ─── Module Features ─────────────────────────────── */}
          <h6 className="fw-bold text-muted mb-3" style={{ borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
            ⚙️ Active Modules
          </h6>
          <Row className="mb-4">
            <Col md={3} xs={6}>
              <Form.Check 
                type="switch" 
                id="edit-feat-finance" 
                label="Finance / Bills" 
                checked={formData.features.finance}
                onChange={() => handleFeatureToggle('finance')}
              />
            </Col>
            <Col md={3} xs={6}>
              <Form.Check 
                type="switch" 
                id="edit-feat-security" 
                label="Gate Logs" 
                checked={formData.features.security}
                onChange={() => handleFeatureToggle('security')}
              />
            </Col>
            <Col md={3} xs={6}>
              <Form.Check 
                type="switch" 
                id="edit-feat-ops" 
                label="Operations (Helpdesk, Notices)" 
                checked={formData.features.operations}
                onChange={() => handleFeatureToggle('operations')}
              />
            </Col>
            <Col md={3} xs={6}>
              <Form.Check 
                type="switch" 
                id="edit-feat-facilities" 
                label="Facilities (Inventory, Docs)" 
                checked={formData.features.facilities}
                onChange={() => handleFeatureToggle('facilities')}
              />
            </Col>
          </Row>

          {/* Admin info (read-only) */}
          {society?.adminEmail && society.adminEmail !== '—' && (
            <div className="bg-light rounded-3 p-3 mb-3">
              <small className="text-muted d-block mb-1">🔑 Society Admin</small>
              <span className="fw-semibold">{society.adminName}</span>
              <span className="text-muted ms-2">({society.adminEmail})</span>
            </div>
          )}

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#0d6efd', border: 'none' }}
            >
              {loading ? <Spinner animation="border" size="sm" /> : '💾 Save Changes'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditSocietyModal;
