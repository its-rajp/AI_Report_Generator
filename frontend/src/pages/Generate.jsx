import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, File, AlertCircle, ArrowRight, CheckCircle, XCircle, Loader, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000');

const Generate = () => {
  const [files, setFiles] = useState([]);
  const [industry, setIndustry] = useState('Power Generation');
  const [service, setService] = useState('CFD');
  const [projectName, setProjectName] = useState('CFD analysis');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const addFiles = (newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
    setValidationResults(null); // Reset validation when files change
  };

  const handleFileChange = (e) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
  }, []);

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setValidationResults(null);
  };

  // Phase 1: Validate files before generating
  const handleValidate = async () => {
    if (files.length === 0) return;
    setIsValidating(true);
    setValidationResults(null);
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('service', service);
    try {
      const res = await fetch(`${API_URL}/validate-files`, { method: 'POST', body: formData });
      const data = await res.json();
      setValidationResults(data);
    } catch (e) {
      alert('Validation failed. Please ensure the backend is running.');
    }
    setIsValidating(false);
  };

  // Phase 2: Open Data Sandbox for first file
  const handleExploreSandbox = () => {
    if (files.length === 0) return;
    // Store files info in sessionStorage for the sandbox page
    sessionStorage.setItem('sandboxService', service);
    sessionStorage.setItem('sandboxProjectName', projectName);
    sessionStorage.setItem('sandboxIndustry', industry);
    navigate('/sandbox', { state: { files, service, projectName, industry } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) { alert("Please upload at least one data file."); return; }
    setIsGenerating(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('industry', industry);
    formData.append('service', service);
    formData.append('project_name', projectName);
    try {
      const response = await fetch(`${API_URL}/generate-report`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('API request failed');
      await response.json();
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert("Error generating report. Please check the backend logs.");
      setIsGenerating(false);
    }
  };

  const industries = ["Oil & Gas", "Chemicals", "Pharmaceuticals", "Food & Beverages", "Metal & Mining", "Power Generation"];
  const services = ["CFD", "FEA", "DEM", "Process Modeling", "EFD"];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 0" }}>
      <h1 className="dashboard-title" style={{ marginBottom: "0.5rem" }}>Generate New Report</h1>
      <p className="hero-subtitle" style={{ marginBottom: "2rem" }}>Configure your project, validate your data, then generate a professional engineering PDF.</p>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label">Project Name</label>
          <input type="text" className="form-control" value={projectName}
            onChange={(e) => setProjectName(e.target.value)} required placeholder="e.g. Turbine Flow Analysis Q3" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div className="form-group">
            <label className="form-label">Industry</label>
            <select className="form-control" value={industry} onChange={(e) => { setIndustry(e.target.value); setValidationResults(null); }}>
              {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Service Discipline</label>
            <select className="form-control" value={service} onChange={(e) => { setService(e.target.value); setValidationResults(null); }}>
              {services.map(srv => <option key={srv} value={srv}>{srv}</option>)}
            </select>
          </div>
        </div>

        {/* File Upload Zone */}
        <div className="form-group">
          <label className="form-label">Simulation Data Files</label>
          <div
            className="file-drop"
            onClick={() => fileInputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{ border: dragOver ? "2px solid var(--primary-color)" : undefined, background: dragOver ? "rgba(99,102,241,0.05)" : undefined, transition: "all 0.2s" }}
          >
            <UploadCloud size={48} style={{ color: "var(--primary-color)", marginBottom: "1rem" }} />
            <h3 style={{ fontSize: "1.125rem", marginBottom: "0.5rem" }}>Click or drag & drop to upload</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>CSV, XLSX, PDF, or TXT (Max 50MB per file)</p>
            <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept=".csv,.xlsx,.pdf,.txt" />
          </div>
        </div>

        {/* File List with Validation Badges */}
        {files.length > 0 && (
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h4 style={{ fontSize: "0.875rem", fontWeight: "600" }}>Attached Files ({files.length})</h4>
              <button type="button" onClick={handleValidate} disabled={isValidating}
                style={{ fontSize: "0.8rem", background: "var(--primary-color)", color: "white", border: "none", borderRadius: "0.4rem", padding: "0.4rem 0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                {isValidating ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={14} />}
                {isValidating ? "Validating..." : "Validate Files"}
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {files.map((f, i) => {
                const fileResult = validationResults?.files?.find(r => r.filename === f.name);
                return (
                  <div key={i} style={{ borderRadius: "0.5rem", border: "1px solid var(--border-color)", overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem", background: "#f8fafc" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <File size={16} color="var(--primary-color)" />
                        <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>{f.name}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                        {fileResult && (
                          fileResult.valid
                            ? <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#16a34a", fontSize: "0.75rem", fontWeight: "600" }}><CheckCircle size={14} /> Valid</span>
                            : <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#dc2626", fontSize: "0.75rem", fontWeight: "600" }}><XCircle size={14} /> Invalid</span>
                        )}
                      </div>
                      <button type="button" onClick={() => removeFile(i)} style={{ color: "#ef4444", background: "none", fontSize: "0.875rem", border: "none", cursor: "pointer" }}>Remove</button>
                    </div>
                    {/* Validation check breakdown */}
                    {fileResult && !fileResult.valid && (
                      <div style={{ padding: "0.75rem 1rem", background: "#fef2f2", borderTop: "1px solid #fecaca" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "#dc2626", marginBottom: "0.4rem" }}>Missing required columns:</p>
                        {fileResult.checks.map((check, ci) => (
                          <div key={ci} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: check.passed ? "#16a34a" : "#dc2626", marginBottom: "0.2rem" }}>
                            {check.passed ? <CheckCircle size={12} /> : <XCircle size={12} />}
                            <span><b>{check.label}</b>{check.matched_column ? ` → matched "${check.matched_column}"` : ""}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {fileResult && fileResult.valid && (
                      <div style={{ padding: "0.5rem 1rem", background: "#f0fdf4", borderTop: "1px solid #bbf7d0" }}>
                        {fileResult.checks.map((check, ci) => (
                          <div key={ci} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "#16a34a", marginBottom: "0.2rem" }}>
                            <CheckCircle size={12} />
                            <span>{check.label} → <b>"{check.matched_column}"</b></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--border-color)" }}>
          {files.length > 0 && (
            <button type="button" onClick={handleExploreSandbox}
              style={{ width: "100%", padding: "0.85rem", background: "transparent", border: "2px solid var(--primary-color)", color: "var(--primary-color)", borderRadius: "0.6rem", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.95rem" }}>
              <BarChart2 size={18} /> Explore Data Sandbox First
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isGenerating}>
              {isGenerating ? "Generating Report..." : "Generate Report"}
              {!isGenerating && <ArrowRight size={18} />}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              <AlertCircle size={16} />
              ~60 seconds
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Generate;
