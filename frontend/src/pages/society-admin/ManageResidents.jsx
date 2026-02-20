import { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Spinner, Alert, Card, Modal, Form, Row, Col } from 'react-bootstrap';
import api from '../../services/api';

const ManageResidents = () => {
  const [users, setUsers] = useState([]);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Member Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [flatId, setFlatId] = useState('');
  const [userType, setUserType] = useState('resident');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, flatsRes] = await Promise.all([
        api.get('/core/users'),
        api.get('/core/flats'),
      ]);
      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (flatsRes.data.success) setFlats(flatsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setFlatId('');
    setUserType('resident');
    setFormError('');
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const payload = {
        firstName,
        lastName,
        email,
        phone,
        password: password || 'Nakshatra@123',
        userType,
      };
      if (flatId) payload.flatNumber = flatId;

      const { data } = await api.post('/core/users', payload);

      if (data.success) {
        setShowAddModal(false);
        resetForm();
        fetchData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role) => {
    const map = {
      resident: { bg: 'primary', label: 'Resident' },
      society_admin: { bg: 'dark', label: 'Admin' },
      staff: { bg: 'info', label: 'Staff' },
      security_guard: { bg: 'warning', label: 'Guard' },
    };
    const r = map[role] || { bg: 'secondary', label: role };
    return <Badge bg={r.bg} className="text-uppercase">{r.label}</Badge>;
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
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>👥 Manage Residents & Staff</h3>
          <p className="text-muted mb-0">{users.length} members registered</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          style={{ backgroundColor: '#6C63FF', border: 'none' }}
        >
          + Add Member
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Members Table */}
      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          {users.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <h5>No members added yet</h5>
              <p>Click "Add Member" to register residents and staff.</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr key={u._id}>
                    <td className="text-muted">{index + 1}</td>
                    <td className="fw-semibold">{u.firstName} {u.lastName}</td>
                    <td>{u.phone || '—'}</td>
                    <td className="text-muted" style={{ fontSize: '13px' }}>{u.email || '—'}</td>
                    <td>{getRoleBadge(u.userType)}</td>
                    <td>
                      <Badge bg={u.isActive !== false ? 'success' : 'danger'} className="px-2 py-1">
                        {u.isActive !== false ? '● Active' : '● Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add Member Modal */}
      <Modal show={showAddModal} onHide={() => { setShowAddModal(false); resetForm(); }} centered size="lg">
        <Modal.Header closeButton style={{ backgroundColor: '#6C63FF', color: '#fff' }}>
          <Modal.Title>👤 Add New Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger" dismissible onClose={() => setFormError('')}>{formError}</Alert>}
          <Form onSubmit={handleAddMember}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    placeholder="e.g., Rajesh"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    placeholder="e.g., Sharma"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="rajesh@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select value={userType} onChange={(e) => setUserType(e.target.value)}>
                    <option value="resident">Resident</option>
                    <option value="staff">Staff</option>
                    <option value="security_guard">Security Guard</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Assign Flat (Optional)</Form.Label>
                  <Form.Select value={flatId} onChange={(e) => setFlatId(e.target.value)}>
                    <option value="">— Select Flat —</option>
                    {flats.map((flat) => (
                      <option key={flat._id} value={flat._id}>
                        {flat.wing}-{flat.flatNumber} ({flat.sizeSqFt || '—'} sqft)
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Default: Nakshatra@123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Form.Text className="text-muted">Leave blank for default password</Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</Button>
              <Button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: '#6C63FF', border: 'none' }}
              >
                {submitting ? <Spinner animation="border" size="sm" /> : '✦ Add Member'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ManageResidents;
