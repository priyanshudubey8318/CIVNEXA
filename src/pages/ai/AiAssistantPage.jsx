import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/aiService';
import {
  Sparkles,
  Send,
  BookOpen,
  ShieldCheck,
  AlertCircle,
  FileText,
  CheckCircle2,
  HelpCircle,
  Upload,
  Info
} from 'lucide-react';

export const AiAssistantPage = () => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am the CIVNEXA Institutional Policy AI Assistant. I can answer questions grounded in the Student Code of Conduct, Anti-Ragging Regulations, Internal Complaints Committee (ICC) Guidelines, and Proctorial Procedures.',
      grounded: true,
      citations: [],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [knowledgeDocs, setKnowledgeDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  useEffect(() => {
    aiService.getKnowledgeDocuments()
      .then((docs) => setKnowledgeDocs(docs))
      .catch((_) => {});
  }, []);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userText = question.trim();
    setQuestion('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const response = await aiService.askAssistant(userText);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: response.answer,
          grounded: response.grounded,
          citations: response.citations || [],
          disclaimer: response.disclaimer,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: err?.response?.data?.message || 'Sorry, I encountered an error communicating with the institutional knowledge base.',
          grounded: false,
          citations: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
    formData.append('category', 'POLICY');

    try {
      const doc = await aiService.uploadKnowledgeDocument(formData);
      setUploadSuccess(`Indexed "${doc.title}" (SHA-256: ${doc.checksumSha256?.substring(0, 12)}...)`);
      const updatedDocs = await aiService.getKnowledgeDocuments();
      setKnowledgeDocs(updatedDocs);
    } catch (err) {
      alert(err?.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '1100px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1 d-flex align-items-center gap-2">
            <Sparkles className="text-primary" size={26} /> Institutional AI Assistant
          </h1>
          <p className="text-muted small mb-0">
            Query university statutes, conduct rules, anti-ragging measures, and disciplinary procedures with verified source citations.
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Chat / Assistant Column */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0 d-flex flex-column" style={{ height: '640px', borderRadius: '16px' }}>
            {/* Chat Messages Box */}
            <div className="card-body p-4 flex-grow-1 overflow-auto" style={{ backgroundColor: '#f8fafc' }}>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`d-flex mb-3 ${m.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  <div
                    className={`p-3 rounded shadow-sm ${
                      m.sender === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-white text-dark border'
                    }`}
                    style={{ maxWidth: '85%', borderRadius: '12px' }}
                  >
                    <div style={{ whiteSpace: 'pre-line', fontSize: '14px', lineHeight: '1.5' }}>{m.text}</div>

                    {m.sender === 'assistant' && (
                      <div className="mt-2 pt-2 border-top">
                        {m.grounded ? (
                          <div className="d-flex align-items-center gap-1 text-success small mb-1">
                            <CheckCircle2 size={13} />
                            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Grounded in Institutional Knowledge</span>
                          </div>
                        ) : (
                          <div className="d-flex align-items-center gap-1 text-warning small mb-1">
                            <AlertCircle size={13} />
                            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Ungrounded / Out of Policy Scope</span>
                          </div>
                        )}

                        {m.citations && m.citations.length > 0 && (
                          <div className="mt-1">
                            <div className="text-muted" style={{ fontSize: '11px', fontWeight: '600' }}>
                              Institutional Citations:
                            </div>
                            {m.citations.map((c, cIdx) => (
                              <div
                                key={cIdx}
                                className="p-2 mt-1 rounded bg-light border text-muted font-monospace"
                                style={{ fontSize: '11px' }}
                              >
                                <strong>[{c.documentTitle || c.sourceTitle}]</strong> {c.section ? `• ${c.section}` : ''}
                                {c.excerpt && <div className="mt-1 font-sans text-dark">"{c.excerpt}"</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="d-flex justify-content-start mb-3">
                  <div className="bg-white p-3 rounded border text-muted small d-flex align-items-center gap-2">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                    Retrieving institutional regulations and synthesizing answer...
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="card-footer bg-white p-3 border-top">
              <form onSubmit={handleAsk} className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ask a question (e.g. 'What is the penalty for ragging?' or 'How do I appeal a disciplinary decision?')"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={loading}
                />
                <button type="submit" className="btn btn-primary d-flex align-items-center gap-1 px-4" disabled={loading || !question.trim()}>
                  <Send size={16} /> Ask
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Knowledge Documents Column */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '16px' }}>
            <div className="card-header bg-white py-3 border-bottom">
              <span className="fw-bold d-flex align-items-center gap-2">
                <BookOpen size={18} className="text-primary" /> Active Knowledge Base
              </span>
            </div>

            <div className="card-body p-3">
              <p className="text-muted small mb-3">
                The institutional RAG model answers queries strictly against these indexed university documents:
              </p>

              <div className="list-group list-group-flush mb-4 small" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {knowledgeDocs.map((doc) => (
                  <div key={doc.id} className="list-group-item px-2 py-2">
                    <div className="fw-semibold text-dark d-flex align-items-center gap-1">
                      <FileText size={14} className="text-muted" /> {doc.title}
                    </div>
                    <div className="text-muted d-flex justify-content-between align-items-center mt-1" style={{ fontSize: '11px' }}>
                      <span className="badge bg-light text-muted border">{doc.category}</span>
                      <span className="font-monospace">{doc.checksumSha256?.substring(0, 10)}...</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload New Document Box */}
              <div className="p-3 bg-light rounded border">
                <div className="fw-semibold small text-dark mb-1 d-flex align-items-center gap-1">
                  <Upload size={14} className="text-primary" /> Upload Policy / Handbook
                </div>
                <div className="text-muted small mb-2" style={{ fontSize: '11px' }}>
                  Administrators may index additional institutional SOPs and circulars.
                </div>
                {uploadSuccess && <div className="alert alert-success small py-1 mb-2">{uploadSuccess}</div>}
                <input
                  type="file"
                  className="form-control form-control-sm"
                  accept=".txt,.pdf,.md"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && <div className="text-muted small mt-1">Indexing and computing SHA-256...</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantPage;
