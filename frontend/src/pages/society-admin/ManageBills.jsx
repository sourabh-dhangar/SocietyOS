import { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Spinner, Alert, Card } from 'react-bootstrap';
import api from '../../services/api';
import GenerateBillModal from '../../components/finance/GenerateBillModal';

const ManageBills = () => {
  const [bills, setBills] = useState([]);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [billsRes, flatsRes] = await Promise.all([
        api.get('/finance/bills'),
        api.get('/core/flats'),
      ]);
      if (billsRes.data.success) setBills(billsRes.data.data);
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

  const getStatusBadge = (status) => {
    const map = {
      paid: { bg: 'success', label: '✓ Paid' },
      pending: { bg: 'warning', label: '● Pending' },
      overdue: { bg: 'danger', label: '✕ Overdue' },
      pending_clearance: { bg: 'info', label: '◷ Clearing' },
    };
    const s = map[status] || { bg: 'secondary', label: status };
    return <Badge bg={s.bg} className="px-2 py-1">{s.label}</Badge>;
  };

  // Summary metrics
  const totalBills = bills.length;
  const paidBills = bills.filter((b) => b.status === 'paid').length;
  const pendingAmount = bills
    .filter((b) => b.status === 'pending' || b.status === 'overdue')
    .reduce((sum, b) => sum + (b.amount || 0), 0);

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
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>💰 Financials & Maintenance Dues</h3>
          <p className="text-muted mb-0">
            {totalBills} bills generated · {paidBills} paid ·{' '}
            <span className="text-danger fw-semibold">₹{pendingAmount.toLocaleString('en-IN')} pending</span>
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          style={{ backgroundColor: '#6C63FF', border: 'none' }}
        >
          + Generate New Bill
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Bills Table */}
      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          {bills.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <h5>No bills generated yet</h5>
              <p>Click "Generate New Bill" to create maintenance bills for your flats.</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Flat</th>
                  <th>Billed To</th>
                  <th>Month</th>
                  <th className="text-end">Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill, index) => (
                  <tr key={bill._id}>
                    <td className="text-muted">{index + 1}</td>
                    <td className="fw-semibold">
                      {bill.flatId?.wing || '—'}-{bill.flatId?.flatNumber || '—'}
                    </td>
                    <td>
                      {bill.userId
                        ? `${bill.userId.firstName || ''} ${bill.userId.lastName || ''}`
                        : <span className="text-muted">—</span>
                      }
                    </td>
                    <td>{bill.billMonth}</td>
                    <td className="text-end fw-semibold">₹{(bill.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="text-muted" style={{ fontSize: '13px' }}>
                      {bill.dueDate
                        ? new Date(bill.dueDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'
                      }
                    </td>
                    <td>{getStatusBadge(bill.status)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Generate Bill Modal */}
      <GenerateBillModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        refreshBills={fetchData}
        flats={flats}
      />
    </Container>
  );
};

export default ManageBills;
