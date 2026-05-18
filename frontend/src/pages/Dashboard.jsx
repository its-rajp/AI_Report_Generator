import React, { useState, useEffect } from 'react';
import { FileText, Search, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    // In a real app, fetch from backend
    fetch(`${API_BASE}/reports`)
      .then(res => res.json())
      .then(data => {
        setReports(data.map(r => ({
          ...r,
          date: new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        })));
      })
      .catch(err => console.error("Error fetching reports", err));
  }, []);

  const filteredReports = reports.filter(r => 
    r.project_name.toLowerCase().includes(search.toLowerCase()) ||
    r.industry.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: reports.length,
    complete: reports.filter(r => r.status === 'Complete').length,
    generating: reports.filter(r => r.status === 'Generating').length,
    drafts: 0
  };

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Reports Dashboard</h1>
        <p className="dashboard-stats">{stats.total} report{stats.total !== 1 ? 's' : ''} generated</p>
      </div>

      <div style={{ marginBottom: "2rem", position: "relative" }}>
        <Search size={20} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input 
          type="text" 
          placeholder="Search by name, industry, or service..." 
          className="form-control"
          style={{ paddingLeft: "3rem" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="report-list" style={{ marginBottom: "2rem" }}>
        {filteredReports.map(report => (
          <div key={report.id} className="report-item">
            <div className="report-info">
              <div className="report-icon">
                <FileText size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h3 className="report-name">{report.project_name}</h3>
                  <span className={`status-badge status-${report.status.toLowerCase()}`}>
                    {report.status === 'Generating' ? '⚙️ Generating' : '✓ Complete'}
                  </span>
                </div>
                <div className="report-meta">
                  <span>{report.industry}</span>
                  <span>•</span>
                  <span>{report.service}</span>
                  <span>•</span>
                  <span>{report.date}</span>
                </div>
              </div>
            </div>
            <Link to={`/report/${report.id}`} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
              View <ChevronRight size={16} />
            </Link>
          </div>
        ))}
        {filteredReports.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            No reports found matching your search.
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.complete}</div>
          <div className="stat-label">Complete</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.generating}</div>
          <div className="stat-label">Generating</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.drafts}</div>
          <div className="stat-label">Drafts</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
