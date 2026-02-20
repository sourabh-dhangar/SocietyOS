import { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Spinner, Alert, Form, InputGroup, Card } from 'react-bootstrap';
import api from '../../services/api';
import AddSocietyModal from '../../components/shared/AddSocietyModal';

const ManageSocieties = () => {
  const [societies, setSocieties] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchSocieties = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/core/societies');
      if (data.success) {
        setSocieties(data.data);
        setFiltered(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch societies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, []);

  // Filter by name or city
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(societies);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      societies.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.address?.city?.toLowerCase().includes(q) ||
          s.registrationNumber?.toLowerCase().includes(q)
      )
    );
  }, [search, societies]);

  const getPlanBadge = (plan) => {
    const colors = { basic: 'secondary', premium: 'primary', enterprise: 'success' };
    return <Badge bg={colors[plan] || 'secondary'} className="text-uppercase">{plan}</Badge>;
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
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>🏢 Manage Societies</h3>
          <p className="text-muted mb-0">{societies.length} societies onboarded</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          style={{ backgroundColor: '#6C63FF', border: 'none' }}
        >
          + Add New Society
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Search Bar */}
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-3">
          <InputGroup>
            <InputGroup.Text className="bg-white border-end-0">🔍</InputGroup.Text>
            <Form.Control
              placeholder="Search by name, city, or registration number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-start-0"
            />
            {search && (
              <Button variant="outline-secondary" onClick={() => setSearch('')}>
                ✕
              </Button>
            )}
          </InputGroup>
        </Card.Body>
      </Card>

      {/* Society Table */}
      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <h5>{search ? 'No societies match your search' : 'No societies onboarded yet'}</h5>
              <p>{search ? 'Try a different search term.' : 'Click "Add New Society" to get started.'}</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Society Name</th>
                  <th>City</th>
                  <th>Reg. Number</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((society, index) => (
                  <tr key={society._id}>
                    <td className="text-muted">{index + 1}</td>
                    <td className="fw-semibold">{society.name}</td>
                    <td>{society.address?.city || '—'}</td>
                    <td><code className="text-muted">{society.registrationNumber}</code></td>
                    <td>{getPlanBadge(society.subscriptionPlan)}</td>
                    <td>
                      <Badge
                        bg={society.isActive !== false ? 'success' : 'danger'}
                        className="px-2 py-1"
                      >
                        {society.isActive !== false ? '● Active' : '● Inactive'}
                      </Badge>
                    </td>
                    <td className="text-muted" style={{ fontSize: '13px' }}>
                      {new Date(society.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <Button variant="outline-primary" size="sm" className="rounded-pill px-3">
                        ✏️ Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add Society Modal */}
      <AddSocietyModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        refreshData={fetchSocieties}
      />
    </Container>
  );
};

export default ManageSocieties;
