import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BarChart2, Table, RefreshCw, AlertCircle } from 'lucide-react';
import Plot from 'react-plotly.js';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000');

const DataSandbox = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { files, service, projectName, industry } = location.state || {};

  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'chart'
  const [xCol, setXCol] = useState('');
  const [yCol, setYCol] = useState('');
  const [chartType, setChartType] = useState('scatter');
  const [isGenerating, setIsGenerating] = useState(false);

  const loadPreview = async (fileIdx) => {
    if (!files || files.length === 0) return;
    setLoading(true);
    setError(null);
    setPreview(null);

    const formData = new FormData();
    formData.append('file', files[fileIdx]);

    try {
      const res = await fetch(`${API_URL}/preview-data`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Failed to load preview');
      const data = await res.json();
      setPreview(data);
      // Auto-select first numeric columns for chart
      if (data.numeric_columns?.length >= 2) {
        setXCol(data.numeric_columns[0]);
        setYCol(data.numeric_columns[1]);
      } else if (data.columns?.length >= 2) {
        setXCol(data.columns[0]);
        setYCol(data.columns[1]);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!files) { navigate('/generate'); return; }
    loadPreview(selectedFileIdx);
  }, [selectedFileIdx]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('industry', industry);
    formData.append('service', service);
    formData.append('project_name', projectName);
    try {
      const res = await fetch(`${API_URL}/generate-report`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Generation failed');
      await res.json();
      navigate('/dashboard');
    } catch (e) {
      alert('Error generating report. Please try again.');
      setIsGenerating(false);
    }
  };

  // Build Plotly chart data
  const buildChartData = () => {
    if (!preview || !xCol || !yCol) return [];
    const x = preview.rows.map(r => r[xCol]);
    const y = preview.rows.map(r => r[yCol]);

    if (chartType === 'bar') return [{ type: 'bar', x, y, name: yCol, marker: { color: '#6366f1' } }];
    if (chartType === 'line') return [{ type: 'scatter', mode: 'lines+markers', x, y, name: yCol, line: { color: '#6366f1' } }];
    return [{ type: 'scatter', mode: 'markers', x, y, name: yCol, marker: { color: '#6366f1', size: 8, opacity: 0.75 } }];
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <button onClick={() => navigate('/generate')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Back to Setup
          </button>
          <h1 className="dashboard-title" style={{ marginBottom: '0.25rem' }}>Data Sandbox</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {projectName} &nbsp;·&nbsp; {service} &nbsp;·&nbsp; {industry}
          </p>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="btn btn-primary"
          style={{ gap: '0.5rem', padding: '0.85rem 1.75rem' }}
        >
          {isGenerating ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={18} />}
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* File Tabs */}
      {files && files.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto' }}>
          {files.map((f, i) => (
            <button key={i} onClick={() => setSelectedFileIdx(i)}
              style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: i === selectedFileIdx ? 'var(--primary-color)' : 'white', color: i === selectedFileIdx ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
              {f.name}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p>Loading preview…</p>
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '1.5rem', color: '#dc2626', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {preview && !loading && (
        <>
          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Rows Previewed', value: preview.row_count },
              { label: 'Total Columns', value: preview.columns.length },
              { label: 'Numeric Columns', value: preview.numeric_columns.length },
              { label: 'Service Type', value: service }
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tab Switch */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {[{ id: 'table', icon: <Table size={16} />, label: 'Data Table' }, { id: 'chart', icon: <BarChart2 size={16} />, label: 'Chart Builder' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: activeTab === tab.id ? 'var(--primary-color)' : 'white', color: activeTab === tab.id ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem' }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* DATA TABLE TAB */}
          {activeTab === 'table' && (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border-color)' }}>
                    {preview.columns.map(col => (
                      <th key={col} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {col}
                        {preview.numeric_columns.includes(col) &&
                          <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', background: '#ede9fe', color: '#7c3aed', borderRadius: '0.25rem', padding: '0.1rem 0.35rem' }}>num</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: '1px solid var(--border-color)', background: ri % 2 === 0 ? 'white' : '#fafafa' }}>
                      {preview.columns.map(col => (
                        <td key={col} style={{ padding: '0.6rem 1rem', color: 'var(--text-color)', whiteSpace: 'nowrap' }}>
                          {row[col] ?? <span style={{ color: '#ccc' }}>null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing first {preview.row_count} rows — {preview.columns.length} columns
              </div>
            </div>
          )}

          {/* CHART BUILDER TAB */}
          {activeTab === 'chart' && (
            <div className="card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="form-label">X Axis</label>
                  <select className="form-control" value={xCol} onChange={e => setXCol(e.target.value)}>
                    {preview.columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Y Axis</label>
                  <select className="form-control" value={yCol} onChange={e => setYCol(e.target.value)}>
                    {preview.columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Chart Type</label>
                  <select className="form-control" value={chartType} onChange={e => setChartType(e.target.value)}>
                    <option value="scatter">Scatter</option>
                    <option value="line">Line</option>
                    <option value="bar">Bar</option>
                  </select>
                </div>
              </div>

              <Plot
                data={buildChartData()}
                layout={{
                  title: { text: `${yCol} vs ${xCol}`, font: { size: 16 } },
                  xaxis: { title: xCol },
                  yaxis: { title: yCol },
                  autosize: true,
                  margin: { t: 60, b: 60, l: 60, r: 20 },
                  plot_bgcolor: '#fafafa',
                  paper_bgcolor: 'white',
                }}
                style={{ width: '100%', height: '400px' }}
                config={{ responsive: true, displayModeBar: true }}
              />
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DataSandbox;
