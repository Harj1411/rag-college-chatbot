import React, { useState, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Layers,
  FilePlus,
  ShieldCheck
} from 'lucide-react';
import { documentAPI } from '../../services/api';

const CATEGORIES = [
  'General',
  'Academic Regulations',
  'Examination Schedule',
  'Hostel & Campus Rules',
  'Fee Structure & Scholarships',
  'Placements & Internships'
];

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState('General');
  const [uploadMessage, setUploadMessage] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const fetchDocuments = async () => {
    try {
      const res = await documentAPI.getAll();
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();

    // Auto-poll if any document is still processing
    const interval = setInterval(() => {
      setDocuments((prev) => {
        const hasProcessing = prev.some((d) => d.status === 'processing' || d.status === 'uploaded');
        if (hasProcessing) {
          fetchDocuments();
        }
        return prev;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadMessage(null);
      setUploadError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadMessage(null);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', category);

    try {
      const res = await documentAPI.upload(formData);
      setUploadMessage(`✅ Document '${selectedFile.name}' uploaded! Processing in background.`);
      setSelectedFile(null);
      // Reset file input
      document.getElementById('file-upload-input').value = '';
      fetchDocuments();
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Failed to upload document. Please check file type.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete '${name}' and purge all its vectors from ChromaDB?`)) {
      return;
    }
    try {
      await documentAPI.delete(id);
      setDocuments(documents.filter((d) => d.id !== id));
    } catch (err) {
      alert('Failed to delete document: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Document Ingestion</h1>
          </div>
          <p className="text-xs text-slate-400">
            Upload and manage official college documents. Ingestion pipeline extracts, chunks, and indexes vectors automatically.
          </p>
        </div>

        <button
          onClick={fetchDocuments}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Upload Box */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 mb-10 shadow-xl">
        <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
          <FilePlus className="w-5 h-5 text-brand-400" />
          Ingest New College Document
        </h2>

        {uploadMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadMessage}</span>
          </div>
        )}

        {uploadError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* File Selector */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select File (PDF, DOCX, TXT)
              </label>
              <input
                id="file-upload-input"
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-500 file:cursor-pointer p-2 rounded-xl bg-slate-900 border border-slate-800"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Category / Domain
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all ${
                selectedFile && !isUploading
                  ? 'bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 shadow-brand-500/20 hover:scale-105'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              }`}
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Ingesting Document...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload & Ingest</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Ingested Documents List Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-400" />
            Ingested Documents Repository ({documents.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Loading document registry...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No documents ingested yet. Upload your first college document above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Filename</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">ChromaDB Chunks</th>
                  <th className="px-5 py-3.5">Uploaded</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {documents.map((doc) => {
                  const isProcessed = doc.status === 'processed';
                  const isProcessing = doc.status === 'processing' || doc.status === 'uploaded';
                  const isFailed = doc.status === 'failed';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-100 flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                        <span className="truncate max-w-xs">{doc.filename}</span>
                      </td>

                      <td className="px-5 py-4 text-slate-400">{doc.category || 'General'}</td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${
                            isProcessed
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isProcessing
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isProcessed && <CheckCircle className="w-3 h-3" />}
                          {isProcessing && <Clock className="w-3 h-3 animate-spin" />}
                          {isFailed && <AlertCircle className="w-3 h-3" />}
                          {doc.status}
                        </span>
                        {doc.error_message && (
                          <p className="text-[10px] text-rose-400 mt-1 max-w-xs truncate" title={doc.error_message}>
                            {doc.error_message}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 font-mono font-medium">
                        <span className="inline-flex items-center gap-1 text-slate-300">
                          <Layers className="w-3.5 h-3.5 text-brand-400" />
                          {doc.chunk_count || 0} vectors
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-400">
                        {doc.uploaded_at
                          ? new Date(doc.uploaded_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleDelete(doc.id, doc.filename)}
                          title="Delete Document & Purge Vectors"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
