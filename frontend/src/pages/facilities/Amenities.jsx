import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert, Badge, Modal, Form, Tabs, Tab } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Amenities = () => {
  const { user } = useAuth();
  const isAdmin = ['super_admin', 'society_admin'].includes(user?.userType);

  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data States
  const [amenities, setAmenities] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Modal States
  const [showAmenityModal, setShowAmenityModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [amenityForm, setAmenityForm] = useState({ id: null, name: '', description: '', rules: '', openTime: '06:00', closeTime: '22:00', maxCapacity: 0, isChargeable: false, ratePerHour: 0, isActive: true });
  const [bookingForm, setBookingForm] = useState({ amenityId: '', bookingDate: '', startTime: '', endTime: '' });
  const [statusForm, setStatusForm] = useState({ id: '', status: '', paymentStatus: '', adminNotes: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'list') {
        const { data } = await api.get('/facilities/amenities');
        if (data.success) setAmenities(data.data);
      } else if (activeTab === 'bookings') {
        const { data } = await api.get('/facilities/bookings');
        if (data.success) setBookings(data.data);
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
  const handleAmenitySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/facilities/amenities', amenityForm);
      if (data.success) { setShowAmenityModal(false); fetchData(); }
    } catch (err) { setError(err.response?.data?.message || 'Error saving amenity'); }
    finally { setSubmitting(false); }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/facilities/bookings', bookingForm);
      if (data.success) { setShowBookingModal(false); setActiveTab('bookings'); }
    } catch (err) { setError(err.response?.data?.message || 'Error booking amenity'); }
    finally { setSubmitting(false); }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.put(`/facilities/bookings/${statusForm.id}`, statusForm);
      if (data.success) { setShowUpdateStatusModal(false); fetchData(); }
    } catch (err) { setError(err.response?.data?.message || 'Error updating booking'); }
    finally { setSubmitting(false); }
  };

  const openBookModal = (am) => {
    setBookingForm({ ...bookingForm, amenityId: am._id });
    setShowBookingModal(true);
  };

  const openEditAmenity = (am) => {
    setAmenityForm({ id: am._id, ...am });
    setShowAmenityModal(true);
  };

  return (
    <Container fluid className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>🏊 Amenities</h2>
          <p className="text-muted mb-0">Manage facilities, clubhouses, and resident bookings</p>
        </div>
        {isAdmin && activeTab === 'list' && (
          <Button onClick={() => { setAmenityForm({ id: null, name: '', description: '', rules: '', openTime: '06:00', closeTime: '22:00', maxCapacity: 0, isChargeable: false, ratePerHour: 0, isActive: true }); setShowAmenityModal(true); }} style={{ backgroundColor: '#1a1a2e', border: 'none' }}>+ Add Amenity</Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-0">
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="px-4 pt-3 border-bottom-0 custom-tabs">
            <Tab eventKey="list" title="Available Amenities">
              {loading ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
              ) : (
                <div className="p-4 bg-light">
                  <Row className="g-4">
                    {amenities.length === 0 ? (
                      <Col><div className="text-center text-muted py-5">No amenities found.</div></Col>
                    ) : (
                      amenities.map(am => (
                        <Col md={6} lg={4} key={am._id}>
                          <Card className="h-100 border-0 shadow-sm rounded-4">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h5 className="fw-bold mb-0">{am.name}</h5>
                                <Badge bg={am.isActive ? 'success' : 'danger'}>{am.isActive ? 'Active' : 'Inactive'}</Badge>
                              </div>
                              <p className="text-muted small mb-3" style={{ minHeight: '40px' }}>{am.description || 'No description provided.'}</p>
                              
                              <div className="d-flex justify-content-between mb-2 small">
                                <span className="text-muted"><i className="bi bi-clock"></i> Timings:</span>
                                <span className="fw-bold">{am.openTime} - {am.closeTime}</span>
                              </div>
                              <div className="d-flex justify-content-between mb-2 small">
                                <span className="text-muted"><i className="bi bi-people"></i> Capacity:</span>
                                <span className="fw-bold">{am.maxCapacity > 0 ? `${am.maxCapacity} persons` : 'Unlimited'}</span>
                              </div>
                              <div className="d-flex justify-content-between mb-4 small">
                                <span className="text-muted"><i className="bi bi-currency-rupee"></i> Pricing:</span>
                                <span className="fw-bold text-success">{am.isChargeable ? `₹${am.ratePerHour}/hr` : 'Free'}</span>
                              </div>

                              <div className="d-flex gap-2 mt-auto">
                                {!isAdmin && am.isActive && (
                                  <Button variant="primary" size="sm" className="w-100 rounded-3" onClick={() => openBookModal(am)}>Book Now</Button>
                                )}
                                {isAdmin && (
                                  <>
                                    <Button variant="outline-primary" size="sm" className="w-100 rounded-3" onClick={() => openEditAmenity(am)}>Edit</Button>
                                    {am.isActive && <Button variant="primary" size="sm" className="w-100 rounded-3" onClick={() => openBookModal(am)}>Book for Flat</Button>}
                                  </>
                                )}
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))
                    )}
                  </Row>
                </div>
              )}
            </Tab>
            
            <Tab eventKey="bookings" title="My Bookings">
              {loading ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-4 py-3 text-muted fw-semibold">Amenity</th>
                        <th className="py-3 text-muted fw-semibold">Resident</th>
                        <th className="py-3 text-muted fw-semibold">Date & Time</th>
                        <th className="py-3 text-muted fw-semibold">Total Cost</th>
                        <th className="py-3 text-muted fw-semibold">Status</th>
                        {isAdmin && <th className="px-4 py-3 text-muted fw-semibold text-end">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.length === 0 ? (
                        <tr><td colSpan={isAdmin ? 6 : 5} className="text-center py-4 text-muted">No bookings found</td></tr>
                      ) : (
                        bookings.map(bk => (
                          <tr key={bk._id}>
                            <td className="px-4 fw-bold">{bk.amenityId?.name}</td>
                            <td>
                              <div>{bk.residentId?.firstName} {bk.residentId?.lastName}</div>
                              <small className="text-muted">{bk.flatId?.wing}-{bk.flatId?.flatNumber}</small>
                            </td>
                            <td>
                              <div>{new Date(bk.bookingDate).toLocaleDateString()}</div>
                              <small className="fw-bold">{bk.startTime} - {bk.endTime}</small>
                            </td>
                            <td className="fw-bold text-success">₹{bk.totalCost?.toLocaleString()}</td>
                            <td>
                              <Badge bg={
                                bk.status === 'approved' ? 'success' : 
                                bk.status === 'rejected' ? 'danger' : 
                                bk.status === 'cancelled' ? 'secondary' : 'warning'
                              }>
                                {bk.status.toUpperCase()}
                              </Badge>
                              {bk.totalCost > 0 && <Badge bg={bk.paymentStatus === 'paid' ? 'success' : 'danger'} className="ms-1">{bk.paymentStatus.toUpperCase()}</Badge>}
                            </td>
                            {isAdmin && (
                              <td className="px-4 text-end">
                                <Button variant="light" size="sm" onClick={() => {
                                  setStatusForm({ id: bk._id, status: bk.status, paymentStatus: bk.paymentStatus, adminNotes: bk.adminNotes || '' });
                                  setShowUpdateStatusModal(true);
                                }}>Manage</Button>
                              </td>
                            )}
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

      {/* Admin Add/Edit Amenity Modal */}
      <Modal show={showAmenityModal} onHide={() => setShowAmenityModal(false)} size="lg" centered>
        <Modal.Header closeButton><Modal.Title>{amenityForm.id ? 'Edit Amenity' : 'Add Amenity'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAmenitySubmit}>
            <Row className="mb-3">
              <Col md={8}><Form.Group><Form.Label>Amenity Name</Form.Label><Form.Control type="text" value={amenityForm.name} onChange={e => setAmenityForm({...amenityForm, name: e.target.value})} required/></Form.Group></Col>
              <Col md={4} className="mt-4"><Form.Check type="switch" label="Is Active?" checked={amenityForm.isActive} onChange={e => setAmenityForm({...amenityForm, isActive: e.target.checked})} /></Col>
            </Row>
            <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={2} value={amenityForm.description} onChange={e => setAmenityForm({...amenityForm, description: e.target.value})} /></Form.Group>
            <Row className="mb-3">
              <Col><Form.Group><Form.Label>Open Time</Form.Label><Form.Control type="time" value={amenityForm.openTime} onChange={e => setAmenityForm({...amenityForm, openTime: e.target.value})} required/></Form.Group></Col>
              <Col><Form.Group><Form.Label>Close Time</Form.Label><Form.Control type="time" value={amenityForm.closeTime} onChange={e => setAmenityForm({...amenityForm, closeTime: e.target.value})} required/></Form.Group></Col>
              <Col><Form.Group><Form.Label>Max Capacity</Form.Label><Form.Control type="number" min="0" value={amenityForm.maxCapacity} onChange={e => setAmenityForm({...amenityForm, maxCapacity: e.target.value})} placeholder="0 for unlimited"/></Form.Group></Col>
            </Row>
            <Row className="mb-3 align-items-center">
              <Col md={4}><Form.Check type="switch" label="Is Chargeable?" checked={amenityForm.isChargeable} onChange={e => setAmenityForm({...amenityForm, isChargeable: e.target.checked})} /></Col>
              {amenityForm.isChargeable && (
                <Col md={4}><Form.Group><Form.Label>Rate Per Hour (₹)</Form.Label><Form.Control type="number" value={amenityForm.ratePerHour} onChange={e => setAmenityForm({...amenityForm, ratePerHour: e.target.value})} /></Form.Group></Col>
              )}
            </Row>
            <Button type="submit" className="w-100" style={{backgroundColor: '#1a1a2e'}} disabled={submitting}>Save Amenity</Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Book Amenity Modal */}
      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Book Slot</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleBookingSubmit}>
            <Form.Group className="mb-3"><Form.Label>Date</Form.Label><Form.Control type="date" value={bookingForm.bookingDate} onChange={e => setBookingForm({...bookingForm, bookingDate: e.target.value})} required min={new Date().toISOString().split('T')[0]} /></Form.Group>
            <Row className="mb-3">
              <Col><Form.Group><Form.Label>Start Time</Form.Label><Form.Control type="time" value={bookingForm.startTime} onChange={e => setBookingForm({...bookingForm, startTime: e.target.value})} required/></Form.Group></Col>
              <Col><Form.Group><Form.Label>End Time</Form.Label><Form.Control type="time" value={bookingForm.endTime} onChange={e => setBookingForm({...bookingForm, endTime: e.target.value})} required/></Form.Group></Col>
            </Row>
            <Button type="submit" className="w-100" style={{backgroundColor: '#0d6efd'}} disabled={submitting}>Submit Request</Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Manage Booking Status Modal (Admin) */}
      <Modal show={showUpdateStatusModal} onHide={() => setShowUpdateStatusModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Manage Booking</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdateStatus}>
            <Form.Group className="mb-3">
              <Form.Label>Booking Status</Form.Label>
              <Form.Select value={statusForm.status} onChange={e => setStatusForm({...statusForm, status: e.target.value})}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Payment Status</Form.Label>
              <Form.Select value={statusForm.paymentStatus} onChange={e => setStatusForm({...statusForm, paymentStatus: e.target.value})}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3"><Form.Label>Admin Notes</Form.Label><Form.Control as="textarea" rows={2} value={statusForm.adminNotes} onChange={e => setStatusForm({...statusForm, adminNotes: e.target.value})} /></Form.Group>
            <Button type="submit" className="w-100" style={{backgroundColor: '#1a1a2e'}} disabled={submitting}>Update</Button>
          </Form>
        </Modal.Body>
      </Modal>

    </Container>
  );
};

export default Amenities;
