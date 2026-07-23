import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useSelector } from 'react-redux';
import AlertModal from '../components/ui/AlertModal';
import ConfirmModal from '../components/ui/ConfirmModal';

const AIEvaluation = () => {
  const { user, token } = useSelector(state => state.auth);
  const [runs, setRuns] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [alertData, setAlertData] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [runsRes, casesRes] = await Promise.all([
        api.get('/evaluations/runs'),
        api.get('/evaluations/cases')
      ]);
      setRuns(runsRes.data);
      setCases(casesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunClick = () => {
    setShowConfirm(true);
  };

  const executeRun = async () => {
    setShowConfirm(false);
    try {
      await api.post('/evaluations/run');
      setAlertData({ isOpen: true, title: 'Success', message: 'Evaluation completed successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setAlertData({ isOpen: true, title: 'Error', message: `Failed to start evaluation: ${err.response?.data?.message || err.message}`, type: 'error' });
    }
  };

  return (
    <div className="page-container">
      <div className="tickets-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">AI Evaluation</h1>
          <p className="page-subtitle">Test and score your AI's performance using predefined test cases</p>
        </div>
        <button className="btn btn-primary" onClick={handleRunClick} style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
          ▶ Run Evaluation Suite
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="section-card">
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Test Cases</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: '#10b981' }}>{cases.length}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Active evaluation scenarios</p>
        </div>
        <div className="section-card">
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Total Runs</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: '#6366f1' }}>{runs.length}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Historical evaluation executions</p>
        </div>
      </div>

      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Recent Evaluation Runs</h2>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Prompt Version</th>
              <th>Correctness</th>
              <th>Citation Accuracy</th>
              <th>Refusal Accuracy</th>
              <th>Avg Response Time</th>
            </tr>
          </thead>
          <tbody>
            {runs.length > 0 ? runs.map(run => (
              <tr key={run._id}>
                <td>{new Date(run.createdAt).toLocaleString()}</td>
                <td>{run.promptVersion ? `${run.promptVersion.name} (v${run.promptVersion.version})` : 'Unknown'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${run.correctnessScore || 0}%`, background: '#10b981' }}></div>
                    </div>
                    <span>{run.correctnessScore || 0}%</span>
                  </div>
                </td>
                <td>{run.citationScore || 0}%</td>
                <td>{run.refusalScore || 0}%</td>
                <td>{run.averageResponseTime ? `${run.averageResponseTime}ms` : 'N/A'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No evaluation runs yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Run Evaluation Suite"
        message="This will run the full evaluation suite against the active Prompt. Proceed?"
        onConfirm={executeRun}
        onCancel={() => setShowConfirm(false)}
        confirmText="Run Suite"
        isDestructive={false}
      />

      <AlertModal 
        isOpen={alertData.isOpen} 
        title={alertData.title} 
        message={alertData.message} 
        type={alertData.type}
        onClose={() => setAlertData({ ...alertData, isOpen: false })} 
      />
    </div>
  );
};

export default AIEvaluation;
