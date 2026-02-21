import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Nav, Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Tab state
  const [loginMethod, setLoginMethod] = useState('admin');

  // Admin fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Resident/Staff fields
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset fields when switching tabs
  const handleTabSwitch = (method) => {
    setLoginMethod(method);
    setError('');
    setEmail('');
    setPassword('');
    setPhone('');
    setOtp('');
    setIsOtpSent(false);
  };

  // ─── Admin Login (Email + Password) ───────────────────────────
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/admin-login', { email, password });

      if (data.success) {
        login(data.data, data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Send OTP ─────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/send-otp', { phone });

      if (data.success) {
        setIsOtpSent(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Verify OTP ───────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/verify-otp', { phone, otp });

      if (data.success) {
        login(data.data, data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        position: 'fixed',
        top: 0,
        left: 0,
      }}
    >
      <Card style={{ width: '100%', maxWidth: '450px' }} className="shadow-lg border-0 rounded-4 mx-3">
        <Card.Body className="p-4">
          {/* Logo / Title */}
          <div className="text-center mb-4">
            <h3 className="fw-bold" style={{ color: '#6C63FF' }}>
              ✦ Nakshatra
            </h3>
            <p className="text-muted mb-0">Society Management Platform</p>
          </div>

          {/* Tab Navigation */}
          <Nav
            variant="pills"
            className="mb-4 justify-content-center"
            activeKey={loginMethod}
            onSelect={(key) => handleTabSwitch(key)}
          >
            <Nav.Item>
              <Nav.Link eventKey="admin">🔑 Admin</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="mobile">📱 Resident / Staff</Nav.Link>
            </Nav.Item>
          </Nav>

          {/* Error Alert */}
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* ─── Admin Login Form ──────────────────────────────── */}
          {loginMethod === 'admin' && (
            <Form onSubmit={handleAdminLogin}>
              <Form.Group className="mb-3" controlId="adminEmail">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="admin@society.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="adminPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100 py-2"
                disabled={loading}
                style={{ backgroundColor: '#6C63FF', border: 'none' }}
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Login as Admin'}
              </Button>
            </Form>
          )}

          {/* ─── Resident / Staff OTP Login Form ──────────────── */}
          {loginMethod === 'mobile' && !isOtpSent && (
            <Form onSubmit={handleSendOtp}>
              <Form.Group className="mb-3" controlId="mobilePhone">
                <Form.Label>Mobile Number</Form.Label>
                <InputGroup>
                  <InputGroup.Text>+91</InputGroup.Text>
                  <Form.Control
                    type="tel"
                    placeholder="Enter 10-digit mobile"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={10}
                    required
                  />
                </InputGroup>
              </Form.Group>

              <Button
                variant="success"
                type="submit"
                className="w-100 py-2"
                disabled={loading || phone.length < 10}
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Send OTP'}
              </Button>
            </Form>
          )}

          {loginMethod === 'mobile' && isOtpSent && (
            <Form onSubmit={handleVerifyOtp}>
              <Form.Group className="mb-3" controlId="mobilePhoneDisabled">
                <Form.Label>Mobile Number</Form.Label>
                <Form.Control type="tel" value={phone} disabled />
              </Form.Group>

              <Form.Group className="mb-3" controlId="otpInput">
                <Form.Label>Enter OTP</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  autoFocus
                />
                <Form.Text className="text-muted">
                  OTP sent to +91 {phone}
                </Form.Text>
              </Form.Group>

              <Button
                variant="success"
                type="submit"
                className="w-100 py-2 mb-2"
                disabled={loading || otp.length < 6}
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Verify & Login'}
              </Button>

              <Button
                variant="link"
                className="w-100"
                onClick={() => {
                  setIsOtpSent(false);
                  setOtp('');
                  setError('');
                }}
              >
                ← Change Number / Resend OTP
              </Button>
            </Form>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default LoginPage;
