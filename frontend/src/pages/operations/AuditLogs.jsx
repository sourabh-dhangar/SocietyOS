import { useState, useEffect } from 'react';
import { Container, Card, Table, Pagination, Form, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import api from '../../services/api';

const AuditLogs = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [data, setData] = useState({ logs: [], totalPages: 1, current: 1 });
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 15 });
      if (moduleFilter) params.append('moduleName', moduleFilter);
      if (actionFilter) params.append('action', actionFilter);

      const res = await api.get(`/core/audit-logs?${params.toString()}`);
      if (res.data.success) {
        setData({
          logs: res.data.data.data,
          totalPages: res.data.data.pagination.totalPages,
          current: res.data.data.pagination.currentPage
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, moduleFilter, actionFilter]);

  const getActionBadge = (action) => {
    const map = {
      CREATE: 'success',
      UPDATE: 'primary',
      DELETE: 'danger',
      LOGIN: 'info',
      OTHER: 'secondary'
    };
    return <Badge bg={map[action] || 'secondary'}>{action}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  return (
    <Container fluid className="p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>📋 System Audit Logs</h3>
          <p className="text-muted mb-0">Record of administrative actions across the platform</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-4">
          <Row className="g-3">
            <Col md={4}>
              <Form.Select value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}>
                <option value="">All Modules</option>
                <option value="Core">Core (Flats/Users)</option>
                <option value="Finance">Finance</option>
                <option value="Security">Security</option>
                <option value="Operations">Operations</option>
                <option value="Facilities">Facilities</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
              </Form.Select>
            </Col>
            <Col md={4} className="text-end">
              <span className="text-muted mt-2 d-inline-block">Showing page {data.current} of {data.totalPages || 1}</span>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          {loading ? (
             <div className="text-center p-5"><Spinner animation="border" /></div>
          ) : data.logs.length === 0 ? (
            <div className="text-center p-5 text-muted">No audit logs found.</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 px-4 py-3 text-muted">Date & Time</th>
                    <th className="border-0 py-3 text-muted">User Executed</th>
                    <th className="border-0 py-3 text-muted">Module / Action</th>
                    <th className="border-0 py-3 text-muted w-50">Description</th>
                    <th className="border-0 px-4 py-3 text-muted text-end">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {data.logs.map((log) => (
                    <tr key={log._id}>
                      <td className="px-4 py-3" style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-3">
                        {log.userId ? (
                          <>
                            <div className="fw-semibold">{log.userId.firstName} {log.userId.lastName}</div>
                            <small className="text-muted">{log.userId.email}</small>
                          </>
                        ) : 'System / Unknown'}
                      </td>
                      <td className="py-3">
                        <div className="mb-1 fw-medium text-secondary">{log.module}</div>
                        {getActionBadge(log.action)}
                      </td>
                      <td className="py-3" style={{ fontSize: '14px', color: '#374151' }}>
                        {log.description}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                           <div className="mt-1" style={{ fontSize: '11px', fontFamily: 'monospace', color: '#6B7280', background: '#F3F4F6', padding: '4px', borderRadius: '4px', overflowX: 'auto' }}>
                             {JSON.stringify(log.metadata)}
                           </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-end text-muted" style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                        {log.ipAddress || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        
        {/* Pagination Controls */}
        {data.totalPages > 1 && (
          <Card.Footer className="bg-white border-0 py-3 px-4 d-flex justify-content-end">
            <Pagination className="mb-0">
              <Pagination.Prev disabled={page === 1} onClick={() => setPage(page - 1)} />
              {[...Array(data.totalPages)].map((_, idx) => (
                <Pagination.Item 
                  key={idx + 1} 
                  active={idx + 1 === page}
                  onClick={() => setPage(idx + 1)}
                >
                  {idx + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next disabled={page === data.totalPages} onClick={() => setPage(page + 1)} />
            </Pagination>
          </Card.Footer>
        )}
      </Card>
    </Container>
  );
};

export default AuditLogs;
