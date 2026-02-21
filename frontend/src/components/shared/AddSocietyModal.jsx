import { useState } from 'react';
import { Modal, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import api from '../../services/api';

const AddSocietyModal = ({ show, handleClose, refreshData }) => {
  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    city: '',
    state: '',
    contactEmail: '',
    contactPhone: '',
    subscriptionPlan: 'basic',
    // Admin credentials
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        // Admin credentials
        adminFirstName: formData.adminFirstName,
        adminLastName: formData.adminLastName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        adminPhone: formData.adminPhone,
      };

      const { data } = await api.post('/core/society', payload);

      if (data.success) {
        setFormData({
          name: '',
          registrationNumber: '',
          city: '',
          state: '',
          contactEmail: '',
          contactPhone: '',
          subscriptionPlan: 'basic',
          adminFirstName: '',
          adminLastName: '',
          adminEmail: '',
          adminPassword: '',
          adminPhone: '',
        });
        refreshData();
        handleClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create society.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton style={{ backgroundColor: '#6C63FF', color: '#fff' }}>
        <Modal.Title>🏢 Add New Society</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          {/* ─── Society Details ─────────────────────────────── */}
          <h6 className="fw-bold text-muted mb-3" style={{ borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
            📋 Society Details
          </h6>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Society Name</Form.Label>
                <Form.Control
                  name="name"
                  placeholder="e.g., Gokuldham CHS"
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
                  placeholder="e.g., MH/2024/12345"
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
                  placeholder="e.g., Mumbai"
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
                  placeholder="e.g., Maharashtra"
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
                  placeholder="society@email.com"
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
                  placeholder="9876543210"
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

          {/* ─── Society Admin Credentials ────────────────────── */}
          <h6 className="fw-bold text-muted mb-3" style={{ borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
            🔑 Society Admin Credentials
          </h6>
          <p className="text-muted small mb-3">
            This person will be the admin of this society. They will login using these credentials.
          </p>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Admin First Name</Form.Label>
                <Form.Control
                  name="adminFirstName"
                  placeholder="e.g., Rajesh"
                  value={formData.adminFirstName}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Admin Last Name</Form.Label>
                <Form.Control
                  name="adminLastName"
                  placeholder="e.g., Sharma"
                  value={formData.adminLastName}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Admin Email</Form.Label>
                <Form.Control
                  type="email"
                  name="adminEmail"
                  placeholder="admin@society.com"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Admin Password</Form.Label>
                <Form.Control
                  type="password"
                  name="adminPassword"
                  placeholder="Min 6 characters"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  minLength={6}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Admin Phone</Form.Label>
                <Form.Control
                  name="adminPhone"
                  placeholder="9876543210"
                  value={formData.adminPhone}
                  onChange={handleChange}
                  maxLength={10}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#6C63FF', border: 'none' }}
            >
              {loading ? <Spinner animation="border" size="sm" /> : '✦ Create Society'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddSocietyModal;
