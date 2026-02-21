import { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Badge, Spinner, Alert, Card, Form, Modal } from 'react-bootstrap';
import api from '../../services/api';
import GenerateBillModal from '../../components/finance/GenerateBillModal';
import { generateBillPDF } from '../../utils/pdfGenerator';

const ManageBills = () => {
  const [bills, setBills] = useState([]);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMonth, setBulkMonth] = useState('');
  const [bulkDueDate, setBulkDueDate] = useState('');
  const [stats, setStats] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [billsRes, flatsRes, statsRes] = await Promise.all([
        api.get('/finance/bills'),
        api.get('/core/flats'),
        api.get('/finance/stats').catch(() => ({ data: { success: false } })),
      ]);
      // Handle paginated response
      if (billsRes.data.success) {
        setBills(billsRes.data.data || []);
      }
      if (flatsRes.data.success) setFlats(flatsRes.data.data);
      if (statsRes.data.success) setStats(statsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBulkGenerate = async () => {
    if (!bulkMonth || !bulkDueDate) {
      setError('Please enter bill month and due date');
      return;
    }
    try {
      setBulkLoading(true);
      setError('');
      const res = await api.post('/finance/bills/bulk', {
        billMonth: bulkMonth,
        dueDate: bulkDueDate,
      });
      if (res.data.success) {
        setSuccess(res.data.message);
        setShowBulkModal(false);
        setBulkMonth('');
        setBulkDueDate('');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk generation failed');
    } finally {
      setBulkLoading(false);
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
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>💰 Financials & Maintenance Dues</h3>
          <p className="text-muted mb-0">
            Manage billing, generate bills, and track payments
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            onClick={() => setShowBulkModal(true)}
            variant="outline-success"
            className="fw-semibold"
          >
            ⚡ Bulk Generate
          </Button>
          <Button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: '#6C63FF', border: 'none' }}
          >
            + Single Bill
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Stats Cards */}
      {stats && (
        <Row className="mb-4 g-3">
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm rounded-4 text-center p-3">
              <div className="fs-3 fw-bold" style={{ color: '#28a745' }}>
                ₹{(stats.totalCollected || 0).toLocaleString('en-IN')}
              </div>
              <small className="text-muted">Total Collected</small>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm rounded-4 text-center p-3">
              <div className="fs-3 fw-bold text-danger">
                ₹{(stats.totalPending || 0).toLocaleString('en-IN')}
              </div>
              <small className="text-muted">Pending Dues</small>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm rounded-4 text-center p-3">
              <div className="fs-3 fw-bold" style={{ color: '#6C63FF' }}>
                {stats.collectionRate || 0}%
              </div>
              <small className="text-muted">Collection Rate</small>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm rounded-4 text-center p-3">
              <div className="fs-3 fw-bold text-info">
                ₹{(stats.sinkingFundCollected || 0).toLocaleString('en-IN')}
              </div>
              <small className="text-muted">Sinking Fund</small>
            </Card>
          </Col>
        </Row>
      )}

      {/* Bills Table */}
      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          {bills.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <h5>No bills generated yet</h5>
              <p>Click "Bulk Generate" to create maintenance bills for all flats at once.</p>
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
                  <th className="text-end">Actions</th>
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
                    <td className="text-end">
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        title="Download PDF"
                        onClick={() => generateBillPDF(bill)}
                      >
                        📄
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Bulk Generate Modal */}
      <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">⚡ Bulk Generate Bills</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            This will auto-calculate bills for <strong>all active flats</strong> based on your society's
            billing config (charge heads). Flats that already have a bill for this month will be skipped.
          </p>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Bill Month</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., March 2026"
              value={bulkMonth}
              onChange={(e) => setBulkMonth(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Due Date</Form.Label>
            <Form.Control
              type="date"
              value={bulkDueDate}
              onChange={(e) => setBulkDueDate(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowBulkModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkGenerate}
            disabled={bulkLoading}
            style={{ backgroundColor: '#28a745', border: 'none' }}
          >
            {bulkLoading ? <Spinner size="sm" /> : '⚡ Generate for All Flats'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Single Bill Modal */}
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
