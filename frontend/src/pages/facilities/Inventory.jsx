import { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Spinner, Alert, Card, Modal, Form, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Inventory = () => {
  const { user } = useAuth();
  const isAdmin = user?.userType === 'society_admin' || user?.userType === 'super_admin';

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Update Stock Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('cleaning');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [minThreshold, setMinThreshold] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/facilities/inventory/low-stock');
      if (data.success) setInventory(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const resetForm = () => {
    setSelectedItem(null);
    setItemName('');
    setCategory('cleaning');
    setQuantity('');
    setUnit('pcs');
    setMinThreshold('');
    setFormError('');
  };

  const openUpdateModal = (item) => {
    if (item) {
      setSelectedItem(item);
      setItemName(item.itemName || '');
      setCategory(item.category || 'cleaning');
      setQuantity(String(item.quantity || ''));
      setUnit(item.unit || 'pcs');
      setMinThreshold(String(item.minThreshold || ''));
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const payload = {
        itemName,
        category,
        quantity: Number(quantity),
        unit,
        minThreshold: Number(minThreshold) || 5,
      };

      const { data } = await api.put('/facilities/inventory', payload);
      if (data.success) {
        resetForm();
        setShowModal(false);
        setSuccessMsg('Inventory updated successfully!');
        fetchInventory();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update inventory.');
    } finally {
      setSubmitting(false);
    }
  };

  const isLowStock = (item) => item.quantity <= (item.minThreshold || 5);

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
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>📦 Inventory Management</h3>
          <p className="text-muted mb-0">
            {inventory.length} items tracked ·{' '}
            <span className="text-danger fw-semibold">
              {inventory.filter(isLowStock).length} low stock
            </span>
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => openUpdateModal(null)}
            style={{ backgroundColor: '#6C63FF', border: 'none' }}
          >
            + Add / Update Stock
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {successMsg && <Alert variant="success" dismissible onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {/* Inventory Table */}
      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          {inventory.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
              <h5>No inventory items</h5>
              <p>Click "Add / Update Stock" to start tracking items.</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th className="text-center">Quantity</th>
                  <th>Unit</th>
                  <th>Last Restocked</th>
                  {isAdmin && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, index) => (
                  <tr
                    key={item._id}
                    className={isLowStock(item) ? 'table-danger' : ''}
                  >
                    <td className="text-muted">{index + 1}</td>
                    <td className="fw-semibold">
                      {item.itemName}
                      {isLowStock(item) && (
                        <Badge bg="danger" className="ms-2" style={{ fontSize: '10px' }}>LOW</Badge>
                      )}
                    </td>
                    <td>
                      <Badge bg="secondary" className="text-uppercase">{item.category}</Badge>
                    </td>
                    <td className="text-center fw-bold" style={{ color: isLowStock(item) ? '#dc3545' : '#198754' }}>
                      {item.quantity}
                    </td>
                    <td className="text-muted">{item.unit}</td>
                    <td className="text-muted" style={{ fontSize: '13px' }}>
                      {item.lastRestocked
                        ? new Date(item.lastRestocked).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'
                      }
                    </td>
                    {isAdmin && (
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="rounded-pill px-3"
                          onClick={() => openUpdateModal(item)}
                        >
                          ✏️ Update
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add / Update Stock Modal */}
      <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#6C63FF', color: '#fff' }}>
          <Modal.Title>📦 {selectedItem ? 'Update Stock' : 'Add Item'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger" dismissible onClose={() => setFormError('')}>{formError}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Item Name *</Form.Label>
              <Form.Control
                placeholder="e.g., Cleaning Liquid"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="cleaning">🧹 Cleaning</option>
                    <option value="electrical">⚡ Electrical</option>
                    <option value="plumbing">🔧 Plumbing</option>
                    <option value="gardening">🌿 Gardening</option>
                    <option value="office">🏢 Office</option>
                    <option value="other">📝 Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit</Form.Label>
                  <Form.Select value={unit} onChange={(e) => setUnit(e.target.value)}>
                    <option value="pcs">Pieces</option>
                    <option value="liters">Liters</option>
                    <option value="kg">Kilograms</option>
                    <option value="packs">Packs</option>
                    <option value="rolls">Rolls</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity *</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g., 50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Min Threshold</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g., 5"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(e.target.value)}
                    min="0"
                  />
                  <Form.Text className="text-muted">Alert when below this</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
              <Button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: '#6C63FF', border: 'none' }}
              >
                {submitting ? <Spinner animation="border" size="sm" /> : '✦ Save'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Inventory;
