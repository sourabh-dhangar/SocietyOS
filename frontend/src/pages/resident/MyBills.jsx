import { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Spinner, Alert, Card, Modal } from 'react-bootstrap';
import api from '../../services/api';

const MyBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paying, setPaying] = useState(false);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/finance/my-bills');
      if (data.success) {
        setBills(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const openPayModal = (bill) => {
    setSelectedBill(bill);
    setShowPayModal(true);
    setError('');
    setSuccessMsg('');
  };

  const handlePayment = async (paymentMethod) => {
    if (!selectedBill) return;
    setPaying(true);
    setError('');

    try {
      const { data } = await api.post('/finance/pay', {
        billId: selectedBill._id,
        amountPaid: selectedBill.amount,
        paymentMethod,
      });

      if (data.success) {
        setSuccessMsg(`Payment of ₹${selectedBill.amount.toLocaleString('en-IN')} recorded successfully via ${paymentMethod.toUpperCase()}!`);
        setShowPayModal(false);
        setSelectedBill(null);
        fetchBills();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

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

  // Summary
  const totalDue = bills
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
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>💳 My Maintenance Bills</h3>
          <p className="text-muted mb-0">
            {bills.length} bills · <span className="text-danger fw-semibold">₹{totalDue.toLocaleString('en-IN')} due</span>
          </p>
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {successMsg && <Alert variant="success" dismissible onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {/* Bills Table */}
      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          {bills.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <h5>No bills found</h5>
              <p>Your society hasn't generated any bills for you yet.</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Month</th>
                  <th className="text-end">Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill, index) => (
                  <tr key={bill._id}>
                    <td className="text-muted">{index + 1}</td>
                    <td className="fw-semibold">{bill.billMonth}</td>
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
                    <td>
                      {(bill.status === 'pending' || bill.status === 'overdue') ? (
                        <Button
                          size="sm"
                          variant="success"
                          className="rounded-pill px-3"
                          onClick={() => openPayModal(bill)}
                        >
                          💳 Pay Now
                        </Button>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '13px' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Payment Modal */}
      <Modal show={showPayModal} onHide={() => setShowPayModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#198754', color: '#fff' }}>
          <Modal.Title>💳 Pay Bill</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBill && (
            <>
              <div className="text-center mb-4">
                <p className="text-muted mb-1">Bill for</p>
                <h4 className="fw-bold mb-1">{selectedBill.billMonth}</h4>
                <h2 className="fw-bold" style={{ color: '#198754' }}>
                  ₹{(selectedBill.amount || 0).toLocaleString('en-IN')}
                </h2>
              </div>

              {/* Breakdown */}
              {selectedBill.breakdown?.length > 0 && (
                <div className="bg-light rounded-3 p-3 mb-4">
                  <h6 className="fw-bold mb-2">📋 Breakdown</h6>
                  {selectedBill.breakdown.map((item, i) => (
                    <div key={i} className="d-flex justify-content-between">
                      <span className="text-muted">{item.chargeName}</span>
                      <span className="fw-semibold">₹{(item.amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}

              <h6 className="fw-bold mb-3 text-center">Choose Payment Method</h6>
              <div className="d-flex flex-column gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-3"
                  onClick={() => handlePayment('upi')}
                  disabled={paying}
                >
                  {paying ? <Spinner animation="border" size="sm" /> : '📱 Pay via UPI'}
                </Button>
                <Button
                  variant="outline-dark"
                  size="lg"
                  className="rounded-3"
                  onClick={() => handlePayment('bank_transfer')}
                  disabled={paying}
                >
                  🏦 Bank Transfer
                </Button>
                <Button
                  variant="outline-secondary"
                  size="lg"
                  className="rounded-3"
                  onClick={() => handlePayment('cash')}
                  disabled={paying}
                >
                  💵 Pay via Cash
                </Button>
                <Button
                  variant="outline-warning"
                  size="lg"
                  className="rounded-3"
                  onClick={() => handlePayment('cheque')}
                  disabled={paying}
                >
                  📝 Pay via Cheque (Pending Clearance)
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default MyBills;
