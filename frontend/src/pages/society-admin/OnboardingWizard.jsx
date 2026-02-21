import { useState, useRef } from 'react';
import { Container, Card, Button, Form, ProgressBar, Alert, Table, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import api from '../../services/api';

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Add Wings
  const [wingsInput, setWingsInput] = useState(''); // comma separated
  
  // Step 2: Upload Flats
  const [flatData, setFlatData] = useState([]);
  const flatFileInput = useRef(null);

  // Step 3: Upload Residents
  const [residentData, setResidentData] = useState([]);
  const residentFileInput = useRef(null);

  // ==========================================
  // STEP HELPERS
  // ==========================================

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`Error parsing CSV: ${results.errors[0].message}`);
          return;
        }
        
        // Basic validation depending on type
        const data = results.data;
        if (type === 'flats') {
          if (!data[0].wing || !data[0].flatNumber) {
            setError('CSV must contain Headers: "wing", "flatNumber", "floor", "sizeSqFt", "status"');
            return;
          }
          setFlatData(data);
          setSuccess(`Successfully parsed ${data.length} flats.`);
        } else if (type === 'residents') {
          if (!data[0].firstName || !data[0].phone) {
            setError('CSV must contain Headers: "firstName", "lastName", "email", "phone", "userType", "flatNumber"');
            return;
          }
          setResidentData(data);
          setSuccess(`Successfully parsed ${data.length} residents.`);
        }
      },
      error: (err) => {
        setError(`Failed to read file: ${err.message}`);
      }
    });
  };

  const submitFlats = async () => {
    if (flatData.length === 0) {
      setStep(3); // skip if nothing uploaded
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/core/flats/bulk', { flats: flatData });
      if (data.success) {
        setSuccess(data.message);
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload flats');
    } finally {
      setLoading(false);
    }
  };

  const submitResidents = async () => {
    if (residentData.length === 0) {
      navigate('/dashboard'); // Finish
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/core/users/bulk', { users: residentData });
      if (data.success) {
        setSuccess(data.message);
        navigate('/dashboard'); // Finish
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload residents');
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // RENDER STEPS
  // ==========================================

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <div className="text-center py-4">
            <h4 className="fw-bold mb-3">📍 Define Society Wings/Blocks</h4>
            <p className="text-muted mb-4">
              Let's start by defining the major wings or blocks in your society (e.g., A, B, C, Tower 1).
              This helps in organizing flats later.
            </p>
            <Form.Group className="mb-4 text-start">
              <Form.Label className="fw-semibold">Wing Names (Comma Separated)</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g. A, B, C, D" 
                value={wingsInput}
                onChange={(e) => setWingsInput(e.target.value)}
              />
              <Form.Text className="text-muted">
                You can skip this if your society doesn't use wings.
              </Form.Text>
            </Form.Group>
            <Button 
              variant="primary" 
              className="w-100 py-2 rounded-3" 
              style={{ backgroundColor: '#6C63FF', border: 'none' }}
              onClick={() => { setError(''); setSuccess(''); setStep(2); }}
            >
              Next: Upload Flats →
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="py-2">
            <h4 className="fw-bold mb-3 text-center">🏠 Bulk Import Flats</h4>
            <p className="text-muted text-center mb-4">
              Upload a CSV file containing all the flats in your society to instantly populate the database.
            </p>
            
            <div className="bg-light p-3 rounded-3 mb-4">
              <h6 className="fw-bold mb-2">Required CSV Format:</h6>
              <Table size="sm" bordered className="mb-0 bg-white" style={{ fontSize: '13px' }}>
                <thead className="table-light">
                  <tr>
                    <th>wing</th>
                    <th>flatNumber</th>
                    <th>floor</th>
                    <th>sizeSqFt</th>
                    <th>status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>A</td><td>101</td><td>1</td><td>1200</td><td>owner_occupied</td>
                  </tr>
                  <tr>
                    <td>B</td><td>205</td><td>2</td><td>1500</td><td>rented</td>
                  </tr>
                </tbody>
              </Table>
              <small className="text-muted mt-2 d-block">
                * Header names must match exactly. Only "wing" and "flatNumber" are strictly required.
              </small>
            </div>

            <div className="text-center mb-4">
              <input 
                type="file" 
                accept=".csv" 
                ref={flatFileInput} 
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e, 'flats')}
              />
              <Button 
                variant="outline-primary" 
                onClick={() => flatFileInput.current?.click()}
              >
                📁 Select Flats CSV File
              </Button>
              {flatData.length > 0 && (
                <Badge bg="success" className="ms-2">
                  {flatData.length} flats loaded
                </Badge>
              )}
            </div>

            <div className="d-flex gap-2">
              <Button variant="outline-secondary" className="w-50" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button 
                variant="primary" 
                className="w-50" 
                style={{ backgroundColor: '#6C63FF', border: 'none' }}
                onClick={submitFlats}
                disabled={loading}
              >
                {loading ? <Spinner size="sm"/> : 'Import & Continue →'}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="py-2">
            <h4 className="fw-bold mb-3 text-center">👥 Bulk Invite Residents</h4>
            <p className="text-muted text-center mb-4">
              Upload a CSV to add Owners and Tenants. Their phone number will become their default login password.
            </p>
            
            <div className="bg-light p-3 rounded-3 mb-4">
              <h6 className="fw-bold mb-2">Required CSV Format:</h6>
              <Table size="sm" bordered className="mb-0 bg-white" style={{ fontSize: '13px' }}>
                <thead className="table-light">
                  <tr>
                    <th>firstName</th>
                    <th>lastName</th>
                    <th>phone</th>
                    <th>email</th>
                    <th>flatNumber</th>
                    <th>userType</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Rahul</td><td>Sharma</td><td>9876543210</td><td>rahul@mail.com</td><td>101</td><td>resident</td>
                  </tr>
                </tbody>
              </Table>
            </div>

            <div className="text-center mb-4">
              <input 
                type="file" 
                accept=".csv" 
                ref={residentFileInput} 
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e, 'residents')}
              />
              <Button 
                variant="outline-primary" 
                onClick={() => residentFileInput.current?.click()}
              >
                📁 Select Residents CSV File
              </Button>
              {residentData.length > 0 && (
                <Badge bg="success" className="ms-2">
                  {residentData.length} records loaded
                </Badge>
              )}
            </div>

            <div className="d-flex gap-2">
              <Button variant="outline-secondary" className="w-50" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button 
                variant="success" 
                className="w-50 fw-bold" 
                onClick={submitResidents}
                disabled={loading}
              >
                {loading ? <Spinner size="sm"/> : 'Finish Setup 🎉'}
              </Button>
            </div>
            <div className="text-center mt-3">
               <Button variant="link" className="text-muted" onClick={() => navigate('/dashboard')}>
                 Skip for now
               </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Container className="py-5" style={{ maxWidth: '600px' }}>
      <div className="text-center mb-4">
        <h2 className="fw-bold" style={{ color: '#6C63FF' }}>✦ Welcome to Nakshatra</h2>
        <p className="text-muted">Let's get your society set up in 3 easy steps!</p>
      </div>

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-4 p-md-5">
          <div className="mb-4">
            <ProgressBar 
              now={(step / 3) * 100} 
              variant="success" 
              style={{ height: '8px', backgroundColor: 'rgba(108,99,255,0.1)' }} 
            />
            <div className="d-flex justify-content-between mt-2 text-muted" style={{ fontSize: '12px', fontWeight: 'bold' }}>
              <span className={step >= 1 ? 'text-primary' : ''}>1. Wings</span>
              <span className={step >= 2 ? 'text-primary' : ''}>2. Flats</span>
              <span className={step >= 3 ? 'text-primary' : ''}>3. Residents</span>
            </div>
          </div>

          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

          {renderStepContent()}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OnboardingWizard;
