import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Download, ArrowLeft, Calendar, Layers, Factory, CheckCircle, Loader } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000');

const ReportView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/reports/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Report not found');
        return res.json();
      })
      .then(data => {
        setReport(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleDownload = async () => {
    if (!report?.download_url) return;
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}${report.download_url}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.file_name || `${report.project_name}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error downloading report. Please try again.');
    }
    setDownloading(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem', gap: '1rem' }}>
        <Loader size={48} style={{ color: 'var(--primary-color)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading report...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem' }}>
        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
        <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  const formattedDate = report.created_at
    ? new Date(report.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 0' }}>
      {/* Back button */}
      <button className="btn btn-outline" style={{ marginBottom: '2rem' }} onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Report Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div className="report-icon" style={{ width: '64px', height: '64px', flexShrink: 0 }}>
              <FileText size={32} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>{report.project_name}</h1>
              <div className="report-meta" style={{ fontSize: '1rem', gap: '1.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Factory size={16} /> {report.industry}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={16} /> {report.service}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={16} /> {formattedDate}
                </span>
              </div>
            </div>
          </div>
          <span className={`status-badge status-${report.status?.toLowerCase()}`} style={{ flexShrink: 0, fontSize: '0.875rem', padding: '0.4rem 1rem' }}>
            {report.status === 'Complete' ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle size={14} /> Complete</span> : `⚙️ ${report.status}`}
          </span>
        </div>
      </div>

      {/* Download Section */}
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        {report.download_url ? (
          <>
            <div style={{ width: '80px', height: '80px', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <FileText size={40} style={{ color: '#059669' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Your Report is Ready</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Click the button below to download your professionally formatted PDF report with embedded visualizations and AI-generated content.
            </p>
            <button
              className="btn btn-primary"
              style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download size={20} />
              {downloading ? 'Downloading...' : `Download PDF — ${report.file_name || 'report.pdf'}`}
            </button>
          </>
        ) : (
          <>
            <div style={{ width: '80px', height: '80px', background: '#fffbeb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Loader size={40} style={{ color: '#d97706' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Report is Generating</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Your report is still being generated. Please check back in a moment.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportView;
