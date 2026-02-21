import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const EmergencyContacts = () => {
  const { user } = useAuth();
  const isAdmin = user?.userType === 'society_admin' || user?.userType === 'super_admin';
  
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Hospital',
    name: '',
    phone: '',
    address: '',
    description: ''
  });

  const categories = ['Hospital', 'Police', 'Fire', 'Plumber', 'Electrician', 'Ambulance', 'Other'];

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/security/emergency-contacts');
      if (data.success) {
        setContacts(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch emergency contacts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/security/emergency-contacts', formData);
      if (data.success) {
        setShowModal(false);
        setFormData({ category: 'Hospital', name: '', phone: '', address: '', description: '' });
        fetchContacts();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      await api.delete(`/security/emergency-contacts/${id}`);
      fetchContacts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete contact.');
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Hospital': return '🏥';
      case 'Police': return '🚓';
      case 'Fire': return '🚒';
      case 'Plumber': return '🔧';
      case 'Electrician': return '⚡';
      case 'Ambulance': return '🚑';
      default: return '📞';
    }
  };

  // Group contacts by category
  const groupedContacts = contacts.reduce((acc, contact) => {
    if (!acc[contact.category]) acc[contact.category] = [];
    acc[contact.category].push(contact);
    return acc;
  }, {});

  return (
    <Container fluid className="p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>🚨 Emergency Contacts</h3>
          <p className="text-muted mb-0">Important numbers for your society</p>
        </div>
        {isAdmin && (
          <Button 
            style={{ backgroundColor: '#dc3545', border: 'none' }} 
            onClick={() => setShowModal(true)}
          >
            + Add Contact
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" style={{ color: '#dc3545' }} />
        </div>
      ) : contacts.length === 0 ? (
        <Card className="border-0 shadow-sm rounded-4 text-center py-5">
          <Card.Body>
            <h5 className="text-muted mb-0">No emergency contacts found.</h5>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {categories.map((cat) => {
            const catContacts = groupedContacts[cat] || [];
            if (catContacts.length === 0) return null;
            
            return (
              <Col md={6} lg={4} key={cat}>
                <Card className="border-0 shadow-sm rounded-4 h-100">
                  <Card.Header className="bg-white border-0 pt-4 px-4 d-flex align-items-center gap-2">
                    <span style={{ fontSize: '24px' }}>{getCategoryIcon(cat)}</span>
                    <h5 className="fw-bold mb-0">{cat}</h5>
                  </Card.Header>
                  <Card.Body className="px-4 pb-4">
                    <div className="d-flex flex-column gap-3">
                      {catContacts.map((contact) => (
                        <div key={contact._id} className="p-3 bg-light rounded-3 position-relative">
                          {isAdmin && (
                            <Button 
                              variant="link" 
                              className="text-danger position-absolute top-0 end-0 p-2 text-decoration-none"
                              onClick={() => handleDelete(contact._id)}
                              title="Delete Contact"
                            >
                              ✕
                            </Button>
                          )}
                          <h6 className="fw-bold mb-1">{contact.name}</h6>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <Badge bg="danger" className="fs-6 px-3 py-2 rounded-pill shadow-sm">
                              📞 {contact.phone}
                            </Badge>
                          </div>
                          {contact.address && (
                            <p className="text-muted mb-1" style={{ fontSize: '13px' }}>📍 {contact.address}</p>
                          )}
                          {contact.description && (
                            <p className="text-muted mb-0" style={{ fontSize: '13px' }}>ℹ️ {contact.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Add Contact Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Emergency Contact</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Category <span className="text-danger">*</span></Form.Label>
              <Form.Select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                required
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Name/Organization <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g. City Hospital, Dr. Smith"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g. 102, 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Address (Optional)</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g. MG Road, Near Station"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2}
                placeholder="e.g. Available 24/7"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="danger" type="submit" disabled={submitting}>
                {submitting ? <Spinner size="sm" /> : 'Save Contact'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

    </Container>
  );
};

export default EmergencyContacts;
