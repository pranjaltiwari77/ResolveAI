import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTicketById, updateTicket, addComment, generateDraftReply, clearDraftReply, deleteTicket } from '../features/tickets/ticketSlice';
import { fetchTeam } from '../features/settings/settingsSlice'; // To get agents list
import { socket } from '../services/socket';
import api from '../services/api';
import AlertModal from '../components/ui/AlertModal';
import ConfirmModal from '../components/ui/ConfirmModal';

const priorityClass = { critical: 'badge-red', high: 'badge-red', medium: 'badge-yellow', low: 'badge-gray' };
const statusClass = { open: 'status-open', 'in-progress': 'status-progress', resolved: 'status-resolved', closed: 'status-resolved' };

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const ticket = useSelector(state => state.tickets.items.find(t => t.id === id));
  const { loading: ticketLoading, draftReply, draftLoading } = useSelector(state => state.tickets);
  const { team } = useSelector(state => state.settings); // Team members for assignee dropdown
  const { user } = useSelector(state => state.auth);

  const isCustomer = user?.role === 'customer';

  const [commentText, setCommentText] = useState('');
  const [replyType, setReplyType] = useState(isCustomer ? 'public' : 'internal'); // 'internal' | 'public'
  const [isUpdating, setIsUpdating] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alertData, setAlertData] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  // Multimedia State
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    dispatch(fetchTicketById(id));
    if (!isCustomer) {
      dispatch(fetchTeam()); // Load team members for agent assignment
    }

    // Socket Integration
    socket.connect();
    socket.emit('join_ticket', id);

    const handleUpdate = () => {
      dispatch(fetchTicketById(id));
    };

    const handleTyping = ({ userName, isTyping }) => {
      setTypingUsers(prev => {
        if (isTyping) {
          return prev.includes(userName) ? prev : [...prev, userName];
        } else {
          return prev.filter(name => name !== userName);
        }
      });
    };

    socket.on('ticket_updated', handleUpdate);
    socket.on('comment_added', handleUpdate);
    socket.on('typing', handleTyping);

    return () => {
      socket.emit('leave_ticket', id);
      socket.off('ticket_updated', handleUpdate);
      socket.off('comment_added', handleUpdate);
      socket.off('typing', handleTyping);
      dispatch(clearDraftReply());
    };
  }, [dispatch, id, isCustomer]);

  // When draft comes back, populate the text box
  useEffect(() => {
    if (draftReply) {
      setCommentText(draftReply);
      setReplyType('public');
    }
  }, [draftReply]);

  const handleUpdate = async (field, value) => {
    if (isCustomer) return; // Customers cannot update fields
    setIsUpdating(true);
    await dispatch(updateTicket({ id, data: { [field]: value } }));
    setIsUpdating(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() && !selectedFile) return;
    
    setIsUpdating(true);

    let uploadedUrl = null;
    let uploadedType = null;

    try {
      // 1. Upload File if present
      const fileToUpload = selectedFile;
      
      if (fileToUpload) {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        
        const uploadRes = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        const uploadData = uploadRes.data;
        uploadedUrl = `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5001'}${uploadData.url}`;
        uploadedType = uploadData.type;
      }

      // 2. Add Comment
      await dispatch(addComment({ 
        id, 
        content: commentText, 
        isPublic: isCustomer ? true : replyType === 'public',
        attachmentUrl: uploadedUrl,
        attachmentType: uploadedType
      }));
      
      setCommentText('');
      setSelectedFile(null);
      dispatch(clearDraftReply());
    } catch (err) {
      console.error(err);
      setAlertData({ isOpen: true, title: 'Error', message: 'Failed to send message: ' + err.message, type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTicket = async () => {
    setIsUpdating(true);
    await dispatch(deleteTicket(id));
    navigate('/tickets');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCommentChange = (e) => {
    setCommentText(e.target.value);
    socket.emit('typing', { ticketId: id, userName: user?.name, isTyping: true });
    
    // Clear typing status after 2s of inactivity
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      socket.emit('typing', { ticketId: id, userName: user?.name, isTyping: false });
    }, 2000);
  };

  const handleGenerateDraft = async () => {
    dispatch(generateDraftReply(id));
  };

  if (ticketLoading && !ticket) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p className="text-muted">Loading ticket details...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Ticket Not Found</h2>
          <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => navigate(isCustomer ? '/chat' : '/tickets')}>Back to Tickets</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={isCustomer ? { maxWidth: '1000px', margin: '0 auto', paddingTop: '2rem' } : {}}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '6px 12px' }}
            onClick={() => navigate(isCustomer ? '/chat' : '/tickets')}
          >
            &larr; Back
          </button>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {user?.role === 'admin' && (
              <button 
                onClick={() => setShowDeleteModal(true)} 
                className="btn" 
                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.85rem' }}
              >
                🗑️ Delete Ticket
              </button>
            )}
            <div>
              <h1 className="page-title">
                {ticket.title} 
                <span style={{ marginLeft: '1rem', color: 'var(--text-muted)', fontSize: '1rem' }}>#{ticket.id.slice(-6).toUpperCase()}</span>
              </h1>
              <p className="page-subtitle">Created {new Date(ticket.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isCustomer ? '1fr' : '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Details & Comments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main Content */}
          <div className="section-card">
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Description</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-primary)' }}>{ticket.description}</p>
            
            {!isCustomer && ticket.aiInsights?.suggestedResolution && (
              <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #8b5cf6' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#8b5cf6', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✨</span> AI Suggested Resolution
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{ticket.aiInsights.suggestedResolution}</p>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="section-card">
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Activity Feed</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {ticket.comments?.length > 0 ? (
                ticket.comments
                  .filter(c => !isCustomer || c.isPublic)
                  .map(c => {
                    const isMyComment = c.author?._id === user?.id || c.author === user?.id;

                    if (c.isSystem) {
                      return (
                        <div key={c._id} style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                          <div style={{ 
                            background: 'rgba(99, 102, 241, 0.1)', 
                            color: 'var(--indigo-400)', 
                            padding: '6px 16px', 
                            borderRadius: '20px', 
                            fontSize: '0.8rem', 
                            fontWeight: 600,
                            border: '1px solid rgba(99, 102, 241, 0.2)'
                          }}>
                            ⚡️ {c.content}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={c._id} style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: isMyComment ? 'flex-end' : 'flex-start',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ 
                          maxWidth: '85%',
                          background: c.isAi ? 'rgba(139, 92, 246, 0.05)' : (isMyComment ? 'var(--primary)' : 'var(--bg-card)'), 
                          border: c.isAi ? '1px solid rgba(139, 92, 246, 0.3)' : (c.isPublic && !isMyComment ? '1px solid var(--border)' : 'none'),
                          color: isMyComment && !c.isAi ? 'white' : 'inherit',
                          padding: '1rem', 
                          borderRadius: '16px',
                          borderBottomRightRadius: isMyComment ? '4px' : '16px',
                          borderBottomLeftRadius: !isMyComment ? '4px' : '16px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 600, color: c.isAi ? '#8b5cf6' : (c.isSystem ? 'var(--text-muted)' : (isMyComment ? 'rgba(255,255,255,0.9)' : 'inherit')) }}>
                                {c.isSystem ? 'System' : (c.isAi ? '🤖 ResolveBot' : (isMyComment ? 'You' : (c.author?.role === 'customer' ? c.author?.name || 'Customer' : `🎧 ${c.author?.name ? c.author.name : 'Support Agent'}`)))}
                              </span>
                              {!isCustomer && !isMyComment && (
                                <span style={{ 
                                  fontSize: '0.65rem', 
                                  padding: '2px 6px', 
                                  borderRadius: '4px', 
                                  background: c.isAi ? '#ede9fe' : (c.isPublic ? '#d1fae5' : '#fef3c7'),
                                  color: c.isAi ? '#6d28d9' : (c.isPublic ? '#047857' : '#b45309'),
                                  textTransform: 'uppercase',
                                  fontWeight: 600
                                }}>
                                  {c.isAi ? 'AI' : (c.isPublic ? 'Public' : 'Internal')}
                                </span>
                              )}
                            </div>
                            <span style={{ color: isMyComment ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                              {new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          {c.content && (
                            <p style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', margin: 0, color: isMyComment && !c.isAi ? 'white' : 'var(--text-primary)' }}>
                              {c.content}
                            </p>
                          )}
                          {c.attachmentUrl && (
                            <div style={{ marginTop: '1rem' }}>
                              {c.attachmentType === 'image' && (
                                <img src={c.attachmentUrl} alt="Attachment" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
                              )}
                              {c.attachmentType === 'audio' && (
                                <audio controls src={c.attachmentUrl} style={{ width: '100%', outline: 'none' }} />
                              )}
                              {c.attachmentType === 'file' && (
                                <a href={c.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', color: 'inherit', textDecoration: 'none' }}>
                                  📎 Download Attachment
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                })
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center' }}>No activity yet.</p>
              )}
            </div>

            <form onSubmit={handleAddComment} style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {!isCustomer && (
                <div style={{ 
                  display: 'flex', 
                  gap: '0.25rem', 
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--border)',
                  background: 'rgba(0,0,0,0.1)'
                }}>
                  <button 
                    type="button" 
                    onClick={() => setReplyType('internal')}
                    style={{ 
                      padding: '6px 14px', 
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      borderRadius: '9999px',
                      border: 'none',
                      background: replyType === 'internal' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                      color: replyType === 'internal' ? '#fbbf24' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    Internal Note
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setReplyType('public')}
                    style={{ 
                      padding: '6px 14px', 
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      borderRadius: '9999px',
                      border: 'none',
                      background: replyType === 'public' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      color: replyType === 'public' ? '#10b981' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    Public Reply
                  </button>
                </div>
              )}

              {typingUsers.length > 0 && (
                <div style={{ padding: '0.5rem 1rem 0', fontSize: '0.8rem', color: 'var(--indigo-400)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'flex', gap: '2px' }}>
                    <span style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', animation: 'pulse 1s infinite' }}></span>
                    <span style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', animation: 'pulse 1s infinite 0.2s' }}></span>
                    <span style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', animation: 'pulse 1s infinite 0.4s' }}></span>
                  </span>
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </div>
              )}

              <textarea 
                rows="4" 
                placeholder={isCustomer ? "Write a reply..." : (replyType === 'internal' ? "Add a private note for your team..." : "Draft a reply to the customer...")}
                value={commentText}
                onChange={handleCommentChange}
                style={{ 
                  width: '100%',
                  padding: '1rem',
                  border: 'none',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '100px',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  lineHeight: '1.5'
                }}
              />
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.75rem 1rem',
                borderTop: '1px solid var(--border)',
                background: 'rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input 
                    type="file" 
                    style={{ display: 'none' }} 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    style={{ 
                      background: 'transparent', 
                      border: '1px solid var(--border)', 
                      padding: '6px 12px', 
                      borderRadius: '9999px', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-secondary)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                    {selectedFile ? 'Change File' : 'Attach File'}
                  </button>
                  {selectedFile && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</span>
                      <button type="button" onClick={() => setSelectedFile(null)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {!isCustomer && (
                    <button 
                      type="button" 
                      onClick={handleGenerateDraft}
                      disabled={draftLoading}
                      style={{ 
                        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', 
                        color: 'white', 
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '9999px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: draftLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: draftLoading ? 0.7 : 1,
                        transition: 'transform 0.1s ease',
                        boxShadow: '0 2px 10px rgba(236, 72, 153, 0.3)'
                      }}
                      onMouseDown={(e) => !draftLoading && (e.currentTarget.style.transform = 'scale(0.96)')}
                      onMouseUp={(e) => !draftLoading && (e.currentTarget.style.transform = 'scale(1)')}
                      onMouseLeave={(e) => !draftLoading && (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 7.5 14.6 3 12"></polyline><polyline points="21 12 16.5 14.6 16.5 19.79"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                      {draftLoading ? 'Generating...' : 'Auto-Draft'}
                    </button>
                  )}

                  <button 
                    type="submit" 
                    disabled={isUpdating || (!commentText.trim() && !selectedFile)}
                    style={{
                      background: isCustomer || replyType === 'public' ? '#10b981' : 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: '9999px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: (isUpdating || (!commentText.trim() && !selectedFile)) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: (isUpdating || (!commentText.trim() && !selectedFile)) ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                      boxShadow: isCustomer || replyType === 'public' ? '0 2px 10px rgba(16, 185, 129, 0.3)' : '0 2px 10px rgba(79, 70, 229, 0.3)'
                    }}
                  >
                    {isUpdating ? 'Saving...' : (
                      <>
                        {isCustomer || replyType === 'public' ? 'Send Reply' : 'Add Note'}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Metadata & Updates (Admin Only) */}
        {!isCustomer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="section-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Properties</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Creator</label>
                  <div style={{ padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ticket.creatorId?.email || 'Unknown User'}
                  </div>
                </div>

                {ticket.metadata && Object.keys(ticket.metadata).length > 0 && (
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Customer Metadata</label>
                    <div style={{ padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {Object.entries(ticket.metadata).map(([key, val]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>{key}:</span>
                          <span>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Status</label>
                  <select 
                    className="form-input" 
                    value={ticket.status} 
                    onChange={(e) => handleUpdate('status', e.target.value)}
                    disabled={isUpdating}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Priority</label>
                  <select 
                    className="form-input" 
                    value={ticket.priority} 
                    onChange={(e) => handleUpdate('priority', e.target.value)}
                    disabled={isUpdating}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Assignee</label>
                  <select 
                    className="form-input" 
                    value={ticket.agentId?._id || ticket.agentId || ''} 
                    onChange={(e) => handleUpdate('agentId', e.target.value)}
                    disabled={isUpdating}
                  >
                    <option value="">Unassigned</option>
                    {team.map(member => (
                      <option key={member._id} value={member._id}>{member.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Category</label>
                  <div style={{ padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                    {ticket.category}
                  </div>
                </div>
              </div>
            </div>

            <div className="section-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>SLA Information</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Response SLA</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500, color: ticket.sla?.responseBreach ? '#ef4444' : 'inherit' }}>
                    {ticket.sla?.responseBreach ? '🔴 Breached' : ticket.sla?.responseDue ? new Date(ticket.sla.responseDue).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resolution SLA</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500, color: ticket.sla?.resolutionBreach ? '#ef4444' : 'inherit' }}>
                    {ticket.sla?.resolutionBreach ? '🔴 Breached' : ticket.sla?.resolutionDue ? new Date(ticket.sla.resolutionDue).toLocaleString() : 'N/A'}
                  </p>
                </div>
                {ticket.sla?.escalatedAt && (
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-escalated At</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500, color: '#f59e0b' }}>
                      {new Date(ticket.sla.escalatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Ticket"
        message="Are you sure you want to delete this ticket? This action cannot be undone."
        onConfirm={handleDeleteTicket}
        onCancel={() => setShowDeleteModal(false)}
        confirmText={isUpdating ? 'Deleting...' : 'Delete'}
        isDestructive={true}
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

export default TicketDetail;
