import { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Badge, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ParkingManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.userType === 'society_admin' || user?.userType === 'super_admin';
  
  const [slots, setSlots] = useState([]);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentSlotId, setCurrentSlotId] = useState(null);
  
  const [formData, setFormData] = useState({
    slotNumber: '',
    category: 'Four-Wheeler',
    status: 'Available',
    allocatedToFlat: '',
    vehicleNumber: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [slotsRes, flatsRes] = await Promise.all([
        api.get('/security/parking'),
        isAdmin ? api.get('/core/flats') : Promise.resolve({ data: { data: [] } })
      ]);
      
      if (slotsRes.data.success) setSlots(slotsRes.data.data);
      if (flatsRes.data.success) setFlats(flatsRes.data.data);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch parking data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (slot = null) => {
    if (slot) {
      setIsEditing(true);
      setCurrentSlotId(slot._id);
      setFormData({
        slotNumber: slot.slotNumber,
        category: slot.category,
        status: slot.status,
        allocatedToFlat: slot.allocatedToFlat?._id || '',
        vehicleNumber: slot.vehicleNumber || '',
        notes: slot.notes || ''
      });
    } else {
      setIsEditing(false);
      setCurrentSlotId(null);
      setFormData({
        slotNumber: '',
        category: 'Four-Wheeler',
        status: 'Available',
        allocatedToFlat: '',
        vehicleNumber: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    // Auto-adjust status based on allocation
    const payload = { ...formData };
    if (payload.allocatedToFlat) {
      payload.status = 'Allocated';
    } else {
      payload.status = 'Available';
    }

    try {
      if (isEditing) {
        await api.put(`/security/parking/${currentSlotId}`, payload);
      } else {
        await api.post('/security/parking', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save parking slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this parking slot?')) return;
    try {
      await api.delete(`/security/parking/${id}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete parking slot.');
    }
  };

  const getStatusBadge = (status) => {
    return status === 'Available' 
      ? <Badge bg="success">Available</Badge>
      : <Badge bg="secondary">Allocated</Badge>;
  };

  return (
    <Container fluid className="p-0">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>🅿️ Parking Management</h3>
          <p className="text-muted mb-0">Manage society parking slots and vehicle allocations</p>
        </div>
        {isAdmin && (
          <Button 
            style={{ backgroundColor: '#6C63FF', border: 'none' }}
            onClick={() => handleOpenModal()}
          >
            + Add Slot
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          {loading ? (
             <div className="text-center py-5">
               <Spinner animation="border" style={{ color: '#6C63FF' }} />
             </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <h5>No parking slots configured</h5>
              <p>Add parking slots to manage resident and visitor parking.</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Slot #</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Allocated Flat</th>
                  <th>Vehicle No.</th>
                  {isAdmin && <th className="text-end">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot._id}>
                    <td className="fw-bold">{slot.slotNumber}</td>
                    <td>{slot.category}</td>
                    <td>{getStatusBadge(slot.status)}</td>
                    <td>
                      {slot.allocatedToFlat 
                        ? `${slot.allocatedToFlat.wing}-${slot.allocatedToFlat.flatNumber}`
                        : <span className="text-muted">—</span>
                      }
                    </td>
                    <td>
                      {slot.vehicleNumber 
                        ? <Badge bg="light" text="dark" className="border border-secondary px-2 py-1">{slot.vehicleNumber}</Badge>
                        : <span className="text-muted">—</span>
                      }
                    </td>
                    {isAdmin && (
                      <td className="text-end">
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleOpenModal(slot)}
                        >
                          ✏️ Edit
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="text-danger"
                          onClick={() => handleDelete(slot._id)}
                        >
                          🗑️
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

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Parking Slot' : 'Add Parking Slot'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Slot Number <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g. A-101 or B2-45"
                value={formData.slotNumber}
                onChange={(e) => setFormData({...formData, slotNumber: e.target.value})}
                required
                disabled={isEditing}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="Two-Wheeler">Two-Wheeler</option>
                <option value="Four-Wheeler">Four-Wheeler</option>
                <option value="Visitor">Visitor</option>
                <option value="Handicap">Handicap</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Allocate to Flat</Form.Label>
              <Form.Select 
                value={formData.allocatedToFlat}
                onChange={(e) => setFormData({...formData, allocatedToFlat: e.target.value})}
              >
                <option value="">-- Unallocated / Available --</option>
                {flats.map(f => (
                  <option key={f._id} value={f._id}>{f.wing}-{f.flatNumber}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Vehicle Number (Optional)</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g. MH12AB1234"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value.toUpperCase()})}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting} style={{ backgroundColor: '#6C63FF', border: 'none' }}>
                {submitting ? <Spinner size="sm"/> : 'Save Slot'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

    </Container>
  );
};

export default ParkingManagement;
