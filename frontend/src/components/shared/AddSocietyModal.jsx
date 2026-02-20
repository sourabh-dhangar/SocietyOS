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

          <Form.Group className="mb-3">
            <Form.Label>Subscription Plan</Form.Label>
            <Form.Select name="subscriptionPlan" value={formData.subscriptionPlan} onChange={handleChange}>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </Form.Select>
          </Form.Group>

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
