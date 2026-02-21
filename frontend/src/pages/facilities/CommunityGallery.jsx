import { useState, useEffect } from 'react';
import { Container, Card, Button, Row, Col, Badge, Modal, Form, Spinner, Alert, Image } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CommunityGallery = () => {
  const { user } = useAuth();
  const isAdmin = ['super_admin', 'society_admin'].includes(user?.userType);

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  // Forms state
  const [newAlbum, setNewAlbum] = useState({ albumName: '', description: '', eventDate: '', isPublic: true });
  const [newPhotoUrls, setNewPhotoUrls] = useState(''); // Comma separated URLs

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const res = await api.get('/facilities/gallery');
      if (res.data.success) {
        setAlbums(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch albums');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/facilities/gallery', newAlbum);
      if (res.data.success) {
        setAlbums([res.data.data, ...albums]);
        setShowCreateModal(false);
        setNewAlbum({ albumName: '', description: '', eventDate: '', isPublic: true });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create album');
    }
  };

  const handleAddPhotos = async () => {
    if (!newPhotoUrls.trim()) return;
    try {
      const photosArray = newPhotoUrls.split(',').map(url => ({ url: url.trim(), caption: '' })).filter(p => p.url);
      const res = await api.put(`/facilities/gallery/${selectedAlbum._id}/photos`, { photos: photosArray });
      if (res.data.success) {
        // Update album locally
        const updatedAlbum = res.data.data;
        setAlbums(albums.map(a => a._id === updatedAlbum._id ? updatedAlbum : a));
        setShowUploadModal(false);
        setNewPhotoUrls('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add photos');
    }
  };

  const handleDeleteAlbum = async (id) => {
    if (!window.confirm('Are you sure you want to delete this album?')) return;
    try {
      await api.delete(`/facilities/gallery/${id}`);
      setAlbums(albums.filter(a => a._id !== id));
      if (selectedAlbum && selectedAlbum._id === id) setShowViewModal(false);
    } catch (err) {
      alert('Failed to delete album');
    }
  };

  return (
    <Container fluid className="p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>📸 Community Gallery</h3>
          <p className="text-muted mb-0">Photos and memories of society events</p>
        </div>
        {isAdmin && (
          <Button variant="primary" onClick={() => setShowCreateModal(true)} style={{ borderRadius: '8px', padding: '10px 20px', backgroundColor: '#6C63FF', border: 'none' }}>
            + Create Album
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center p-5"><Spinner animation="border" /></div>
      ) : albums.length === 0 ? (
        <Card className="text-center border-0 shadow-sm rounded-4 p-5">
          <Card.Body>
            <h5 className="text-muted">No albums found</h5>
            <p className="mb-0">Check back later for event photos!</p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {albums.map((album) => (
            <Col md={4} lg={3} key={album._id}>
              <Card className="border-0 shadow-sm h-100 rounded-4 overflow-hidden" style={{ cursor: 'pointer' }}>
                <div 
                  className="bg-light d-flex align-items-center justify-content-center" 
                  style={{ height: '200px', cursor: 'pointer', overflow: 'hidden' }}
                  onClick={() => { setSelectedAlbum(album); setShowViewModal(true); }}
                >
                  {album.photos && album.photos.length > 0 ? (
                    <Image src={album.photos[0].url} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span className="text-muted fs-1">📷</span>
                  )}
                </div>
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="fw-bold mb-0 text-truncate">{album.albumName}</h6>
                    {!album.isPublic && <Badge bg="warning" text="dark">Draft</Badge>}
                  </div>
                  <p className="text-muted small mb-2 text-truncate">{album.description || 'No description'}</p>
                  <div className="d-flex justify-content-between align-items-center mt-3 border-top pt-2">
                    <small className="text-muted">
                      {new Date(album.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </small>
                    <Badge bg="light" text="dark">{album.photos?.length || 0} photos</Badge>
                  </div>
                </Card.Body>
                {isAdmin && (
                    <Card.Footer className="bg-white border-0 px-3 pb-3 pt-0 d-flex gap-2">
                       <Button variant="outline-primary" size="sm" className="w-50" onClick={() => { setSelectedAlbum(album); setShowUploadModal(true); }}>Add Photos</Button>
                       <Button variant="outline-danger" size="sm" className="w-50" onClick={() => handleDeleteAlbum(album._id)}>Delete</Button>
                    </Card.Footer>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* CREATE ALBUM MODAL */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Form onSubmit={handleCreateAlbum}>
          <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold">Create New Album</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Album Title *</Form.Label>
              <Form.Control type="text" required value={newAlbum.albumName} onChange={e => setNewAlbum({...newAlbum, albumName: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={2} value={newAlbum.description} onChange={e => setNewAlbum({...newAlbum, description: e.target.value})} />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Event Date</Form.Label>
                  <Form.Control type="date" value={newAlbum.eventDate} onChange={e => setNewAlbum({...newAlbum, eventDate: e.target.value})} />
                </Form.Group>
              </Col>
              <Col md={6}>
                 <Form.Group className="mb-3">
                  <Form.Label>Visibility</Form.Label>
                  <Form.Select value={newAlbum.isPublic} onChange={e => setNewAlbum({...newAlbum, isPublic: e.target.value === 'true'})}>
                    <option value="true">Public (Visible to All)</option>
                    <option value="false">Hidden (Admin Only)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" style={{ backgroundColor: '#6C63FF', border: 'none' }}>Save Album</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* UPLOAD PHOTOS MODAL */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Add Photos to {selectedAlbum?.albumName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Image URLs (comma separated) *</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={4} 
              placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
              value={newPhotoUrls} 
              onChange={e => setNewPhotoUrls(e.target.value)} 
            />
            <Form.Text className="text-muted">Paste publicly accessible image URLs separated by commas.</Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowUploadModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddPhotos} style={{ backgroundColor: '#6C63FF', border: 'none' }}>Upload</Button>
        </Modal.Footer>
      </Modal>

      {/* VIEW ALBUM MODAL */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="xl" centered>
        <Modal.Header closeButton className="border-0 border-bottom">
          <Modal.Title className="fw-bold">{selectedAlbum?.albumName}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light p-4">
            <p>{selectedAlbum?.description}</p>
            {selectedAlbum?.photos?.length === 0 ? (
              <div className="text-center p-5 text-muted">No photos in this album yet.</div>
            ) : (
                <Row className="g-3">
                  {selectedAlbum?.photos?.map((photo, i) => (
                    <Col md={4} lg={3} key={i}>
                      <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
                        <Image src={photo.url} alt={`Gallery ${i}`} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                      </Card>
                    </Col>
                  ))}
                </Row>
            )}
        </Modal.Body>
      </Modal>

    </Container>
  );
};

export default CommunityGallery;
