import { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import api from '../../services/api';

const GenerateBillModal = ({ show, handleClose, refreshBills, flats }) => {
  const [flatId, setFlatId] = useState('');
  const [billMonth, setBillMonth] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maintenanceAmount, setMaintenanceAmount] = useState('');
  const [sinkingFundAmount, setSinkingFundAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Derive userId from selected flat's owner
  const selectedFlat = flats.find((f) => f._id === flatId);
  const userId = selectedFlat?.owner?._id || selectedFlat?.owner || null;

  const totalAmount = (Number(maintenanceAmount) || 0) + (Number(sinkingFundAmount) || 0);

  const resetForm = () => {
    setFlatId('');
    setBillMonth('');
    setDueDate('');
    setMaintenanceAmount('');
    setSinkingFundAmount('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!flatId || !billMonth || !dueDate) {
      setError('Please fill all required fields.');
      return;
    }

    if (totalAmount <= 0) {
      setError('Total amount must be greater than 0.');
      return;
    }

    setLoading(true);

    try {
      const breakdown = [];
      if (Number(maintenanceAmount) > 0) {
        breakdown.push({ chargeName: 'Maintenance', amount: Number(maintenanceAmount) });
      }
      if (Number(sinkingFundAmount) > 0) {
        breakdown.push({ chargeName: 'Sinking Fund', amount: Number(sinkingFundAmount) });
      }

      const { data } = await api.post('/finance/bills', {
        flatId,
        userId,
        billMonth,
        dueDate,
        amount: totalAmount,
        breakdown,
      });

      if (data.success) {
        resetForm();
        refreshBills();
        handleClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate bill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={() => { handleClose(); resetForm(); }} centered size="lg">
      <Modal.Header closeButton style={{ backgroundColor: '#6C63FF', color: '#fff' }}>
        <Modal.Title>💳 Generate Maintenance Bill</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          {/* Flat Selection */}
          <Form.Group className="mb-3">
            <Form.Label>Select Flat *</Form.Label>
            <Form.Select value={flatId} onChange={(e) => setFlatId(e.target.value)} required>
              <option value="">— Choose a Flat —</option>
              {flats.map((flat) => (
                <option key={flat._id} value={flat._id}>
                  {flat.wing}-{flat.flatNumber}
                  {flat.owner ? ` (${flat.owner.firstName || ''} ${flat.owner.lastName || ''})` : ' (Vacant)'}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Bill Month *</Form.Label>
                <Form.Control
                  placeholder="e.g., March 2026"
                  value={billMonth}
                  onChange={(e) => setBillMonth(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Due Date *</Form.Label>
                <Form.Control
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Charge Breakdown */}
          <div className="bg-light rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-3">📋 Charge Breakdown</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Maintenance Charge (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g., 3500"
                    value={maintenanceAmount}
                    onChange={(e) => setMaintenanceAmount(e.target.value)}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sinking Fund (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g., 500"
                    value={sinkingFundAmount}
                    onChange={(e) => setSinkingFundAmount(e.target.value)}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="text-end">
              <span className="text-muted">Total: </span>
              <span className="fw-bold fs-5" style={{ color: '#6C63FF' }}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={() => { handleClose(); resetForm(); }}>Cancel</Button>
            <Button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#6C63FF', border: 'none' }}
            >
              {loading ? <Spinner animation="border" size="sm" /> : '✦ Generate Bill'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default GenerateBillModal;
