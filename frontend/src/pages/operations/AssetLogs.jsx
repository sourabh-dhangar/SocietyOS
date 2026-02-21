import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert, Badge, Modal, Form, Tabs, Tab } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AssetLogs = () => {
  const { user } = useAuth();
  const isAdmin = ['super_admin', 'society_admin'].includes(user?.userType);

  const [activeTab, setActiveTab] = useState('maintenance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data States
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [stpLogs, setStpLogs] = useState([]);
  const [tankerLogs, setTankerLogs] = useState([]);

  // Modal States
  const [showMainModal, setShowMainModal] = useState(false);
  const [showStpModal, setShowStpModal] = useState(false);
  const [showTankerModal, setShowTankerModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [mainForm, setMainForm] = useState({ assetName: '', taskType: 'servicing', lastCompletedDate: '', nextDueDate: '', costIncurred: 0, vendorName: '' });
  const [stpForm, setStpForm] = useState({ logDate: '', operatorName: '', phLevel: 7, tssLevel: 0, codLevel: 0, bodLevel: 0, motorStatus: 'running', remarks: '' });
  const [tankerForm, setTankerForm] = useState({ deliveryDate: '', vendorName: '', capacityLiters: 10000, cost: 0, isPaid: false, receivedBy: '', operatorNotes: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'maintenance') {
        // Assuming 'params' is defined elsewhere or will be defined. For now, making it syntactically correct.
        // If 'params' is not defined, this will cause a runtime error.
        const params = new URLSearchParams(); // Placeholder for params
        const { data } = await api.get(`/operations/assets/maintenance?${params.toString()}`);
        if (data.success) setMaintenanceLogs(data.data);
      } else if (activeTab === 'stp') {
        const { data } = await api.get('/operations/stp');
        if (data.success) setStpLogs(data.data);
      } else if (activeTab === 'tanker') {
        const { data } = await api.get('/operations/water-tankers');
        if (data.success) setTankerLogs(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Handlers
  const handleMainSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/operations/assets/maintenance', mainForm); // Corrected: removed extra '{'
      if (data.success) { setShowMainModal(false); fetchData(); }
    } catch (err) { setError(err.response?.data?.message || 'Error saving maintenance log'); }
    finally { setSubmitting(false); }
  };

  const handleStpSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/operations/stp', stpForm);
      if (data.success) { setShowStpModal(false); fetchData(); }
    } catch (err) { setError(err.response?.data?.message || 'Error saving STP log'); }
    finally { setSubmitting(false); }
  };

  const handleTankerSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/operations/water-tankers', tankerForm);
      if (data.success) { setShowTankerModal(false); fetchData(); }
    } catch (err) { setError(err.response?.data?.message || 'Error saving Tanker log'); }
    finally { setSubmitting(false); }
  };

  return (
    <Container fluid className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>🏗️ Facility Logs</h2>
          <p className="text-muted mb-0">Track maintenance, STP operations, and water tanker deliveries</p>
        </div>
        {isAdmin && (
          <div className="d-flex gap-2">
            {activeTab === 'maintenance' && <Button onClick={() => setShowMainModal(true)} style={{ backgroundColor: '#1a1a2e', border: 'none' }}>+ Log Maintenance</Button>}
            {activeTab === 'stp' && <Button onClick={() => setShowStpModal(true)} style={{ backgroundColor: '#0d6efd', border: 'none' }}>+ Add STP Reading</Button>}
            {activeTab === 'tanker' && <Button onClick={() => setShowTankerModal(true)} style={{ backgroundColor: '#0dcaf0', border: 'none' }}>+ Log Water Tanker</Button>}
          </div>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-0">
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="px-4 pt-3 border-bottom-0 custom-tabs">
            <Tab eventKey="maintenance" title="Asset Maintenance">
              {loading ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-4 py-3 text-muted fw-semibold">Asset Name</th>
                        <th className="py-3 text-muted fw-semibold">Task Type</th>
                        <th className="py-3 text-muted fw-semibold">Vendor</th>
                        <th className="py-3 text-muted fw-semibold">Completed On</th>
                        <th className="py-3 text-muted fw-semibold">Cost</th>
                        <th className="px-4 py-3 text-muted fw-semibold">Next Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenanceLogs.length === 0 ? (
                        <tr><td colSpan="6" className="text-center py-4 text-muted">No maintenance logs found</td></tr>
                      ) : (
                        maintenanceLogs.map(log => (
                          <tr key={log._id}>
                            <td className="px-4 fw-bold">{log.assetName}</td>
                            <td><Badge bg="secondary" className="text-uppercase">{log.taskType}</Badge></td>
                            <td>{log.vendorName || '-'}</td>
                            <td>{new Date(log.lastCompletedDate).toLocaleDateString()}</td>
                            <td className="fw-bold text-success">₹{log.costIncurred?.toLocaleString()}</td>
                            <td className="px-4">{log.nextDueDate ? new Date(log.nextDueDate).toLocaleDateString() : 'N/A'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Tab>
            
            <Tab eventKey="stp" title="STP LogBook">
              {loading ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-4 py-3 text-muted fw-semibold">Date</th>
                        <th className="py-3 text-muted fw-semibold">Operator</th>
                        <th className="py-3 text-muted fw-semibold">pH Level</th>
                        <th className="py-3 text-muted fw-semibold">TSS (mg/L)</th>
                        <th className="py-3 text-muted fw-semibold">Motor Status</th>
                        <th className="px-4 py-3 text-muted fw-semibold">Logged By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stpLogs.length === 0 ? (
                        <tr><td colSpan="6" className="text-center py-4 text-muted">No STP logs found</td></tr>
                      ) : (
                        stpLogs.map(log => (
                          <tr key={log._id}>
                            <td className="px-4 fw-bold">{new Date(log.logDate).toLocaleDateString()}</td>
                            <td>{log.operatorName}</td>
                            <td>
                              <Badge bg={log.phLevel >= 6.5 && log.phLevel <= 8.5 ? 'success' : 'danger'}>{log.phLevel}</Badge>
                            </td>
                            <td>
                              <Badge bg={log.tssLevel < 50 ? 'success' : 'warning'}>{log.tssLevel}</Badge>
                            </td>
                            <td>
                              <Badge bg={log.motorStatus === 'running' ? 'success' : log.motorStatus === 'stopped' ? 'danger' : 'warning'}>
                                {log.motorStatus.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-4 text-muted">{log.loggedBy?.firstName} {log.loggedBy?.lastName}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Tab>

            <Tab eventKey="tanker" title="Water Tankers">
              {loading ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-4 py-3 text-muted fw-semibold">Delivery Date</th>
                        <th className="py-3 text-muted fw-semibold">Vendor</th>
                        <th className="py-3 text-muted fw-semibold">Capacity</th>
                        <th className="py-3 text-muted fw-semibold">Cost</th>
                        <th className="py-3 text-muted fw-semibold">Status</th>
                        <th className="px-4 py-3 text-muted fw-semibold">Received By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tankerLogs.length === 0 ? (
                        <tr><td colSpan="6" className="text-center py-4 text-muted">No tanker logs found</td></tr>
                      ) : (
                        tankerLogs.map(log => (
                          <tr key={log._id}>
                            <td className="px-4 fw-bold">{new Date(log.deliveryDate).toLocaleDateString()}</td>
                            <td>{log.vendorName}</td>
                            <td>{log.capacityLiters.toLocaleString()} L</td>
                            <td className="fw-bold">₹{log.cost?.toLocaleString()}</td>
                            <td><Badge bg={log.isPaid ? 'success' : 'danger'}>{log.isPaid ? 'PAID' : 'UNPAID'}</Badge></td>
                            <td className="px-4 text-muted">{log.receivedBy || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* MODALS */}
      {/* 1. Maintenance Modal */}
      <Modal show={showMainModal} onHide={() => setShowMainModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Log Asset Maintenance</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleMainSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Asset Name</Form.Label>
              <Form.Control type="text" value={mainForm.assetName} onChange={e => setMainForm({...mainForm, assetName: e.target.value})} required/>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Task Type</Form.Label>
              <Form.Select value={mainForm.taskType} onChange={e => setMainForm({...mainForm, taskType: e.target.value})}>
                <option value="cleaning">Cleaning</option>
                <option value="servicing">Servicing</option>
                <option value="inspection">Inspection</option>
                <option value="repair">Repair</option>
              </Form.Select>
            </Form.Group>
            <Row className="mb-3">
              <Col><Form.Group><Form.Label>Completed Date</Form.Label><Form.Control type="date" value={mainForm.lastCompletedDate} onChange={e => setMainForm({...mainForm, lastCompletedDate: e.target.value})} /></Form.Group></Col>
              <Col><Form.Group><Form.Label>Next Due</Form.Label><Form.Control type="date" value={mainForm.nextDueDate} onChange={e => setMainForm({...mainForm, nextDueDate: e.target.value})} /></Form.Group></Col>
            </Row>
            <Row className="mb-3">
              <Col><Form.Group><Form.Label>Cost</Form.Label><Form.Control type="number" value={mainForm.costIncurred} onChange={e => setMainForm({...mainForm, costIncurred: e.target.value})} /></Form.Group></Col>
              <Col><Form.Group><Form.Label>Vendor Name</Form.Label><Form.Control type="text" value={mainForm.vendorName} onChange={e => setMainForm({...mainForm, vendorName: e.target.value})} /></Form.Group></Col>
            </Row>
            <Button type="submit" className="w-100" style={{backgroundColor: '#1a1a2e'}} disabled={submitting}>Log Maintenance</Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* 2. STP Modal */}
      <Modal show={showStpModal} onHide={() => setShowStpModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Log STP Reading</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleStpSubmit}>
            <Row className="mb-3">
              <Col><Form.Group><Form.Label>Log Date</Form.Label><Form.Control type="date" value={stpForm.logDate} onChange={e => setStpForm({...stpForm, logDate: e.target.value})} /></Form.Group></Col>
              <Col><Form.Group><Form.Label>Operator</Form.Label><Form.Control type="text" value={stpForm.operatorName} onChange={e => setStpForm({...stpForm, operatorName: e.target.value})} required/></Form.Group></Col>
            </Row>
            <Row className="mb-3">
              <Col><Form.Group><Form.Label>pH Level</Form.Label><Form.Control type="number" step="0.1" value={stpForm.phLevel} onChange={e => setStpForm({...stpForm, phLevel: e.target.value})} required/></Form.Group></Col>
              <Col><Form.Group><Form.Label>TSS (mg/L)</Form.Label><Form.Control type="number" value={stpForm.tssLevel} onChange={e => setStpForm({...stpForm, tssLevel: e.target.value})} required/></Form.Group></Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Motor Status</Form.Label>
              <Form.Select value={stpForm.motorStatus} onChange={e => setStpForm({...stpForm, motorStatus: e.target.value})}>
                <option value="running">Running</option>
                <option value="stopped">Stopped</option>
                <option value="maintenance">Under Maintenance</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Remarks</Form.Label>
              <Form.Control as="textarea" rows={2} value={stpForm.remarks} onChange={e => setStpForm({...stpForm, remarks: e.target.value})} />
            </Form.Group>
            <Button type="submit" className="w-100" style={{backgroundColor: '#0d6efd'}} disabled={submitting}>Save Reading</Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* 3. Tanker Modal */}
      <Modal show={showTankerModal} onHide={() => setShowTankerModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Log Water Tanker</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleTankerSubmit}>
            <Row className="mb-3">
              <Col><Form.Group><Form.Label>Date</Form.Label><Form.Control type="date" value={tankerForm.deliveryDate} onChange={e => setTankerForm({...tankerForm, deliveryDate: e.target.value})} /></Form.Group></Col>
              <Col><Form.Group><Form.Label>Vendor</Form.Label><Form.Control type="text" value={tankerForm.vendorName} onChange={e => setTankerForm({...tankerForm, vendorName: e.target.value})} required/></Form.Group></Col>
            </Row>
            <Row className="mb-3">
              <Col><Form.Group><Form.Label>Capacity (Liters)</Form.Label><Form.Control type="number" value={tankerForm.capacityLiters} onChange={e => setTankerForm({...tankerForm, capacityLiters: e.target.value})} required/></Form.Group></Col>
              <Col><Form.Group><Form.Label>Cost (₹)</Form.Label><Form.Control type="number" value={tankerForm.cost} onChange={e => setTankerForm({...tankerForm, cost: e.target.value})} required/></Form.Group></Col>
            </Row>
            <Row className="mb-3 align-items-center">
              <Col><Form.Group><Form.Label>Received By</Form.Label><Form.Control type="text" value={tankerForm.receivedBy} onChange={e => setTankerForm({...tankerForm, receivedBy: e.target.value})} /></Form.Group></Col>
              <Col className="mt-4"><Form.Check type="switch" label="Payment Cleared?" checked={tankerForm.isPaid} onChange={e => setTankerForm({...tankerForm, isPaid: e.target.checked})} /></Col>
            </Row>
            <Button type="submit" className="w-100" style={{backgroundColor: '#0dcaf0'}} disabled={submitting}>Log Tanker</Button>
          </Form>
        </Modal.Body>
      </Modal>

    </Container>
  );
};

export default AssetLogs;
