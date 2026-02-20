import { useState } from 'react';
import { Modal, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import api from '../../services/api';

const VisitorEntryModal = ({ show, handleClose, refreshVisitors, flats }) => {
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [purpose, setPurpose] = useState('Guest');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [flatId, setFlatId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setVisitorName('');
    setVisitorPhone('');
    setPurpose('Guest');
    setVehicleNumber('');
    setFlatId('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/security/visitors', {
        visitorName,
        visitorPhone,
        purpose,
        vehicleNumber: vehicleNumber || undefined,
        flatId: flatId || undefined,
      });

      if (data.success) {
        resetForm();
        refreshVisitors();
        handleClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log visitor entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={() => { handleClose(); resetForm(); }} centered size="lg">
      <Modal.Header closeButton style={{ backgroundColor: '#198754', color: '#fff' }}>
        <Modal.Title>🚪 New Visitor Entry</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Visitor Name *</Form.Label>
                <Form.Control
                  size="lg"
                  placeholder="e.g., Rahul Kumar"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Phone</Form.Label>
                <Form.Control
                  size="lg"
                  placeholder="9876543210"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Purpose *</Form.Label>
                <Form.Select size="lg" value={purpose} onChange={(e) => setPurpose(e.target.value)} required>
                  <option value="Guest">👤 Guest</option>
                  <option value="Delivery">📦 Delivery</option>
                  <option value="Service">🔧 Service</option>
                  <option value="Cab">🚗 Cab / Ride</option>
                  <option value="Other">📝 Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Visiting Flat</Form.Label>
                <Form.Select size="lg" value={flatId} onChange={(e) => setFlatId(e.target.value)}>
                  <option value="">— Select Flat —</option>
                  {flats.map((flat) => (
                    <option key={flat._id} value={flat._id}>
                      {flat.wing}-{flat.flatNumber}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Vehicle Number (Optional)</Form.Label>
            <Form.Control
              size="lg"
              placeholder="e.g., MH 02 AB 1234"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button variant="secondary" size="lg" onClick={() => { handleClose(); resetForm(); }}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              style={{ backgroundColor: '#198754', border: 'none' }}
            >
              {loading ? <Spinner animation="border" size="sm" /> : '✦ Log Entry'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default VisitorEntryModal;
