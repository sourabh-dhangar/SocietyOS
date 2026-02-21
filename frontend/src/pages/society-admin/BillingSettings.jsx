import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, Spinner, Alert, Badge, Modal, Row, Col } from 'react-bootstrap';
import api from '../../services/api';

const BillingSettings = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHead, setNewHead] = useState({
    name: '', type: 'fixed', rate: '', isNonOccupancy: false, isSinkingFund: false, percentageOf: '',
  });

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finance/config');
      if (res.data.success) setConfig(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load billing config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const res = await api.put('/finance/config', {
        chargeHeads: config.chargeHeads,
        defaultDueDay: config.defaultDueDay,
        lateFee: config.lateFee,
      });
      if (res.data.success) {
        setConfig(res.data.data);
        setSuccess('Billing settings saved ✓');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addChargeHead = () => {
    if (!newHead.name || !newHead.rate) {
      setError('Name and rate are required');
      return;
    }
    const updated = { ...config };
    updated.chargeHeads.push({
      ...newHead,
      rate: Number(newHead.rate),
      isActive: true,
    });
    setConfig(updated);
    setNewHead({ name: '', type: 'fixed', rate: '', isNonOccupancy: false, isSinkingFund: false, percentageOf: '' });
    setShowAddModal(false);
  };

  const toggleChargeHead = (index) => {
    const updated = { ...config };
    updated.chargeHeads[index].isActive = !updated.chargeHeads[index].isActive;
    setConfig(updated);
  };

  const removeChargeHead = (index) => {
    const updated = { ...config };
    updated.chargeHeads.splice(index, 1);
    setConfig(updated);
  };

  const getTypeLabel = (type) => {
    const map = {
      per_sqft: { bg: 'primary', label: '/sq.ft' },
      fixed: { bg: 'secondary', label: 'Fixed' },
      percentage: { bg: 'info', label: '%' },
    };
    return <Badge bg={map[type]?.bg || 'dark'}>{map[type]?.label || type}</Badge>;
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
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>⚙️ Billing Settings</h3>
          <p className="text-muted mb-0">Configure charge heads, due dates, and late fees for your society</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => setShowAddModal(true)}>+ Add Charge Head</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ backgroundColor: '#6C63FF', border: 'none' }}
          >
            {saving ? <Spinner size="sm" /> : '💾 Save Config'}
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Charge Heads Table */}
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Header className="bg-white border-0 py-3">
          <h5 className="fw-bold mb-0">📋 Charge Heads</h5>
          <small className="text-muted">These rates are used when generating bulk bills</small>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Charge Name</th>
                <th>Type</th>
                <th className="text-end">Rate (₹)</th>
                <th>Flags</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {config?.chargeHeads?.map((head, i) => (
                <tr key={i} className={!head.isActive ? 'text-decoration-line-through opacity-50' : ''}>
                  <td className="text-muted">{i + 1}</td>
                  <td className="fw-semibold">{head.name}</td>
                  <td>{getTypeLabel(head.type)}</td>
                  <td className="text-end fw-semibold">
                    {head.type === 'percentage' ? `${head.rate}%` : `₹${head.rate}`}
                    {head.type === 'percentage' && head.percentageOf && (
                      <small className="text-muted d-block">of {head.percentageOf}</small>
                    )}
                  </td>
                  <td>
                    {head.isSinkingFund && <Badge bg="warning" text="dark" className="me-1">Sinking Fund</Badge>}
                    {head.isNonOccupancy && <Badge bg="danger" className="me-1">NOC</Badge>}
                  </td>
                  <td>
                    <Badge
                      bg={head.isActive ? 'success' : 'secondary'}
                      role="button"
                      onClick={() => toggleChargeHead(i)}
                      style={{ cursor: 'pointer' }}
                    >
                      {head.isActive ? '● Active' : '● Off'}
                    </Badge>
                  </td>
                  <td>
                    <Button variant="outline-danger" size="sm" onClick={() => removeChargeHead(i)}>
                      🗑
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* General Settings */}
      <Row className="g-3">
        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-4 p-3">
            <h6 className="fw-bold mb-3">📅 Default Due Day</h6>
            <Form.Control
              type="number"
              min={1}
              max={28}
              value={config?.defaultDueDay || 10}
              onChange={(e) => setConfig({ ...config, defaultDueDay: parseInt(e.target.value) || 10 })}
            />
            <small className="text-muted mt-1 d-block">Day of month when bills are due (1-28)</small>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-4 p-3">
            <h6 className="fw-bold mb-3">⏰ Late Fee</h6>
            <Form.Check
              type="switch"
              label="Enable Late Fee"
              checked={config?.lateFee?.enabled || false}
              onChange={(e) => setConfig({
                ...config,
                lateFee: { ...config.lateFee, enabled: e.target.checked }
              })}
            />
            {config?.lateFee?.enabled && (
              <div className="mt-2">
                <Form.Control
                  type="number"
                  placeholder="Amount"
                  value={config?.lateFee?.amount || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    lateFee: { ...config.lateFee, amount: Number(e.target.value) }
                  })}
                  className="mb-2"
                />
                <Form.Select
                  value={config?.lateFee?.type || 'fixed'}
                  onChange={(e) => setConfig({
                    ...config,
                    lateFee: { ...config.lateFee, type: e.target.value }
                  })}
                >
                  <option value="fixed">Fixed (₹)</option>
                  <option value="percentage">Percentage (%)</option>
                </Form.Select>
              </div>
            )}
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-4 p-3">
            <h6 className="fw-bold mb-3">ℹ️ How It Works</h6>
            <ul className="small text-muted mb-0" style={{ paddingLeft: '16px' }}>
              <li><strong>per_sqft</strong> — rate × flat area</li>
              <li><strong>fixed</strong> — same for all flats</li>
              <li><strong>percentage</strong> — % of another charge</li>
              <li><strong>NOC</strong> — only for non-owner flats</li>
            </ul>
          </Card>
        </Col>
      </Row>

      {/* Add Charge Head Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">+ Add Charge Head</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Charge Name</Form.Label>
            <Form.Control
              placeholder="e.g., Common Light Bill"
              value={newHead.name}
              onChange={(e) => setNewHead({ ...newHead, name: e.target.value })}
            />
          </Form.Group>
          <Row className="mb-3">
            <Col>
              <Form.Label className="fw-semibold">Type</Form.Label>
              <Form.Select
                value={newHead.type}
                onChange={(e) => setNewHead({ ...newHead, type: e.target.value })}
              >
                <option value="fixed">Fixed (₹)</option>
                <option value="per_sqft">Per Sq.ft</option>
                <option value="percentage">Percentage (%)</option>
              </Form.Select>
            </Col>
            <Col>
              <Form.Label className="fw-semibold">Rate</Form.Label>
              <Form.Control
                type="number"
                placeholder={newHead.type === 'percentage' ? 'e.g., 10' : 'e.g., 500'}
                value={newHead.rate}
                onChange={(e) => setNewHead({ ...newHead, rate: e.target.value })}
              />
            </Col>
          </Row>
          {newHead.type === 'percentage' && (
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Percentage Of (Charge Name)</Form.Label>
              <Form.Control
                placeholder="e.g., Maintenance"
                value={newHead.percentageOf}
                onChange={(e) => setNewHead({ ...newHead, percentageOf: e.target.value })}
              />
            </Form.Group>
          )}
          <div className="d-flex gap-3">
            <Form.Check
              type="checkbox"
              label="Non-Occupancy"
              checked={newHead.isNonOccupancy}
              onChange={(e) => setNewHead({ ...newHead, isNonOccupancy: e.target.checked })}
            />
            <Form.Check
              type="checkbox"
              label="Sinking Fund"
              checked={newHead.isSinkingFund}
              onChange={(e) => setNewHead({ ...newHead, isSinkingFund: e.target.checked })}
            />
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button onClick={addChargeHead} style={{ backgroundColor: '#6C63FF', border: 'none' }}>
            Add Charge Head
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BillingSettings;
