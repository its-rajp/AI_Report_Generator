import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Generate = () => {
  const [files, setFiles] = useState([]);
  const [industry, setIndustry] = useState('Power Generation');
  const [service, setService] = useState('CFD');
  const [projectName, setProjectName] = useState('CFD analysis');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      alert("Please upload at least one data file.");
      return;
    }
    
    setIsGenerating(true);
    
    // Create FormData for the backend
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('industry', industry);
    formData.append('service', service);
    formData.append('project_name', projectName);

    // In production (Vercel), use relative /api path. In local dev, use localhost.
    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000');

    try {
      const response = await fetch(`${API_URL}/generate-report`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
          throw new Error('API request failed');
      }
      const data = await response.json();
      
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert("Error generating report");
      setIsGenerating(false);
    }
  };

  const industries = ["Oil & Gas", "Chemicals", "Pharmaceuticals", "Food & Beverages", "Metal & Mining", "Power Generation"];
  const services = ["CFD", "FEA", "DEM", "Process Modeling", "EFD"];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 0" }}>
      <h1 className="dashboard-title" style={{ marginBottom: "0.5rem" }}>Generate New Report</h1>
      <p className="hero-subtitle" style={{ marginBottom: "2rem" }}>Configure your project details and upload simulation data files.</p>
      
      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label">Project Name</label>
          <input 
            type="text" 
            className="form-control" 
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
            placeholder="e.g. Turbine Flow Analysis Q3"
          />
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div className="form-group">
            <label className="form-label">Industry</label>
            <select 
              className="form-control"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Service Discipline</label>
            <select 
              className="form-control"
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              {services.map(srv => <option key={srv} value={srv}>{srv}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Simulation Data Files</label>
          <div 
            className="file-drop"
            onClick={() => fileInputRef.current.click()}
          >
            <UploadCloud size={48} style={{ color: "var(--primary-color)", marginBottom: "1rem" }} />
            <h3 style={{ fontSize: "1.125rem", marginBottom: "0.5rem" }}>Click to upload or drag and drop</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>CSV, XLSX, PDF, or TXT (Max 50MB per file)</p>
            <input 
              type="file" 
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
              accept=".csv,.xlsx,.pdf,.txt"
            />
          </div>
        </div>

        {files.length > 0 && (
          <div className="form-group">
            <h4 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>Attached Files ({files.length})</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem", background: "#f8fafc", borderRadius: "0.5rem", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <File size={16} color="var(--primary-color)" />
                    <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>{f.name}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} style={{ color: "#ef4444", background: "none", fontSize: "0.875rem" }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--border-color)" }}>
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ flex: 1 }}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating Report..." : "Generate Report"}
            {!isGenerating && <ArrowRight size={18} />}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            <AlertCircle size={16} />
            Takes ~60 seconds
          </div>
        </div>
      </form>
    </div>
  );
};

export default Generate;
