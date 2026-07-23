import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchConversations, createConversation, fetchMessages, addMessage, updateLastMessage, setLastMessageComplete, rateMessage, escalateConversation, approveAction, rejectAction } from '../features/chat/chatSlice';
import { fetchTickets, createTicket } from '../features/tickets/ticketSlice';
import AlertModal from '../components/ui/AlertModal';

const CustomerChat = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { conversations, messages, loading: chatLoading } = useSelector(state => state.chat);
  const { items: tickets, loading: ticketsLoading, createLoading } = useSelector(state => state.tickets);
  const { token } = useSelector(state => state.auth);
  
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'tickets' | 'kb'
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [activeConv, setActiveConv] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [alertData, setAlertData] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const messagesEndRef = useRef(null);

  // Knowledge Base state
  const [kbArticles, setKbArticles] = useState([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbSearch, setKbSearch] = useState('');
  const [kbCategory, setKbCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    dispatch(fetchConversations());
    dispatch(fetchTickets());
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === 'kb' && kbArticles.length === 0) {
      setKbLoading(true);
      fetch('http://localhost:5001/api/articles', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => { setKbArticles(Array.isArray(data) ? data : []); })
        .catch(() => {})
        .finally(() => setKbLoading(false));
    }
  }, [activeTab, token, kbArticles.length]);

  useEffect(() => {
    if (conversations.length > 0 && !activeConv) {
      setActiveConv(conversations[0]);
    }
  }, [conversations, activeConv]);

  useEffect(() => {
    if (activeConv) {
      dispatch(fetchMessages(activeConv.id));
    }
  }, [dispatch, activeConv]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Generate a smart, human-like title from the first message
  const generateConversationTitle = (message) => {
    if (!message) return 'Chat Session';
    const msg = message.trim();

    // Keyword-based smart titles
    const rules = [
      { keywords: ['refund', 'money back', 'charge'],         title: 'Refund Request' },
      { keywords: ['return', 'send back', 'exchange'],        title: 'Return & Exchange' },
      { keywords: ['cancel', 'cancellation', 'unsubscribe'],  title: 'Cancellation Request' },
      { keywords: ['payment', 'billing', 'invoice', 'paid'],  title: 'Billing Inquiry' },
      { keywords: ['shipping', 'delivery', 'tracking', 'package', 'order'], title: 'Shipping & Delivery' },
      { keywords: ['password', 'login', 'sign in', 'account', 'access'],   title: 'Account Access Issue' },
      { keywords: ['broken', 'not working', 'error', 'bug', 'issue', 'problem'], title: 'Technical Support' },
      { keywords: ['how to', 'how do i', 'help me', 'guide', 'tutorial'],  title: 'How-To Question' },
      { keywords: ['price', 'cost', 'plan', 'subscription', 'upgrade'],    title: 'Pricing & Plans' },
      { keywords: ['damage', 'damaged', 'broken item', 'defective'],        title: 'Damaged Item Report' },
      { keywords: ['wrong item', 'incorrect', 'missing'],                   title: 'Incorrect Order' },
    ];

    const lower = msg.toLowerCase();
    for (const rule of rules) {
      if (rule.keywords.some(k => lower.includes(k))) {
        return rule.title;
      }
    }

    // Fallback: use first ~40 chars of message, trimmed cleanly
    const words = msg.split(' ').slice(0, 6).join(' ');
    const truncated = words.length < msg.length ? words + '…' : words;
    return truncated.charAt(0).toUpperCase() + truncated.slice(1);
  };

  const handleNewChat = async (firstMessage = null) => {
    const title = firstMessage
      ? generateConversationTitle(firstMessage)
      : `Chat — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const res = await dispatch(createConversation({ title })).unwrap();
    setActiveConv(res);
    return res;
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    await dispatch(createTicket(form));
    setShowModal(false);
    setForm({ title: '', description: '' });
  };

  const handleSendMessage = async (e, overrideText = null) => {
    if (e) e.preventDefault();
    const userMessage = overrideText || inputValue.trim();
    if (!userMessage || isStreaming) return;

    if (!overrideText) setInputValue('');

    // Auto-create a conversation with a smart title if none is active
    let conv = activeConv;
    if (!conv) {
      conv = await handleNewChat(userMessage);
    }
    if (!conv) return;
    
    // Add user message to UI immediately
    dispatch(addMessage({ role: 'user', content: userMessage, id: Date.now() }));
    // Add empty assistant message placeholder
    dispatch(addMessage({ role: 'assistant', content: '', id: 'streaming-temp', citations: [] }));
    setIsStreaming(true);

    try {
      const response = await fetch(`http://localhost:5001/api/chat/conversations/${conv.id}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (!dataStr) continue;
              
              try {
                const data = JSON.parse(dataStr);
                if (data.type === 'chunk') {
                  dispatch(updateLastMessage(data.text));
                } else if (data.type === 'done') {
                  dispatch(setLastMessageComplete({ messageId: data.messageId, citations: data.citations }));
                } else if (data.type === 'error') {
                  dispatch(updateLastMessage(`\n\n[Error: ${data.message}]`));
                }
              } catch (e) {
                console.error('Failed to parse stream chunk', dataStr, e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming failed:', error);
      dispatch(updateLastMessage('\n\n[Connection Error]'));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleVoiceRecord = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support voice recording. Try Chrome!");
      return;
    }

    if (isListening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      setInputValue(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleRate = (messageId, feedback) => {
    dispatch(rateMessage({ messageId, feedback }));
  };

  const parseMessageContent = (content) => {
    if (!content) return { text: '', pendingActionId: null, pendingActionName: null, needsEscalation: false };
    
    // Check for Escalation
    if (content.includes('[ACTION_REQUIRED:Escalate]')) {
      return {
        text: content.replace('[ACTION_REQUIRED:Escalate]', '').trim(),
        pendingActionId: null,
        pendingActionName: null,
        needsEscalation: true
      };
    }

    const pendingActionMatch = content.match(/\[PENDING_ACTION:(.*?):(.*?)\]/);
    if (pendingActionMatch) {
      return {
        text: content.replace(pendingActionMatch[0], '').trim(),
        pendingActionId: pendingActionMatch[1],
        pendingActionName: pendingActionMatch[2],
        needsEscalation: false
      };
    }
    
    // Fallback for old sensitive action string
    const actionMatch = content.match(/\[ACTION_REQUIRED:(.*?)\]/);
    if (actionMatch) {
      return {
        text: content.replace(actionMatch[0], '').trim(),
        pendingActionId: 'legacy',
        pendingActionName: actionMatch[1],
        needsEscalation: false
      };
    }
    return { text: content, pendingActionId: null, pendingActionName: null, needsEscalation: false };
  };

  const handleApproveAction = async (actionId, actionName) => {
    if (actionId === 'legacy') {
      handleSendMessage(null, `[Action Approved]: ${actionName}`);
      return;
    }
    try {
      await dispatch(approveAction(actionId)).unwrap();
      handleSendMessage(null, `[System]: The ${actionName} action was approved and executed successfully. What's next?`);
    } catch (err) {
      alert('Failed to approve action.');
    }
  };

  const handleRejectAction = async (actionId, actionName) => {
    if (actionId === 'legacy') {
      handleSendMessage(null, `[Action Rejected]: ${actionName}`);
      return;
    }
    try {
      await dispatch(rejectAction(actionId)).unwrap();
      handleSendMessage(null, `[System]: The user rejected the ${actionName} action.`);
    } catch (err) {
      alert('Failed to reject action.');
    }
  };

  const handleEscalate = async () => {
    if (!activeConv) return;
    try {
      const res = await dispatch(escalateConversation(activeConv.id)).unwrap();
      if (res.ticketId) {
        navigate(`/tickets/${res.ticketId}`);
      }
    } catch (err) {
      console.error('Escalation failed', err);
      alert('Failed to escalate. Please try again or create a ticket manually.');
    }
  };

  return (
    <div className="customer-portal">
      {/* Premium Segmented Control for Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <div className="segmented-control">
          <button 
            className={`segment-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Support Chat
          </button>
          <button 
            className={`segment-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            🎫 My Tickets
          </button>
          <button 
            className={`segment-btn ${activeTab === 'kb' ? 'active' : ''}`}
            onClick={() => setActiveTab('kb')}
          >
            📚 Knowledge Base
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <div className="chat-layout">
          {/* Sidebar for Conversations */}
          <div className="chat-sidebar">
            <div className="chat-sidebar-header">
              <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Chats</h2>
              <button className="btn btn-ghost btn-sm" style={{ padding: '0 8px', fontSize: '1.2rem', color: 'var(--indigo-400)' }} onClick={() => handleNewChat()}>+</button>
            </div>
            
            {chatLoading ? (
              <div style={{ padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
                {conversations.map(conv => (
                  <div 
                    key={conv.id} 
                    className={`conv-item ${activeConv?.id === conv.id ? 'active' : ''}`}
                    onClick={() => setActiveConv(conv)}
                  >
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {conversations.length === 0 && <p style={{ padding: '1.25rem', color: 'var(--text-muted)' }}>No conversations yet.</p>}
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="chat-main">
            {activeConv ? (
              <>
                {/* Messages Scroll Area */}
                <div className="chat-bubbles-container">
                  {messages.map((msg, index) => {
                    const parsed = parseMessageContent(msg.content);
                    return (
                      <div key={msg.id || index} className={`bubble-wrapper ${msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}`}>
                        <div className="chat-bubble">
                          {parsed.text}
                          
                          {/* Sensitive Action Request UI */}
                          {parsed.pendingActionId && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '12px', color: '#fca5a5' }}>
                              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>⚠️</span> Action Required
                              </p>
                              <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>The AI needs your permission to execute: <strong>{parsed.pendingActionName}</strong>.</p>
                              <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button 
                                  className="btn btn-sm" 
                                  style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px' }}
                                  onClick={() => handleApproveAction(parsed.pendingActionId, parsed.pendingActionName)}
                                  disabled={isStreaming}
                                >
                                  Approve
                                </button>
                                <button 
                                  className="btn btn-sm" 
                                  style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px' }}
                                  onClick={() => handleRejectAction(parsed.pendingActionId, parsed.pendingActionName)}
                                  disabled={isStreaming}
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Escalation Request UI */}
                          {parsed.needsEscalation && (
                            <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '12px', color: '#e0e7ff' }}>
                              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                                <span>🧑‍💻</span> Agent Handoff
                              </p>
                              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                It looks like I can't solve this issue automatically. Would you like me to convert our chat history into a support ticket for a human agent?
                              </p>
                              <button 
                                className="btn btn-primary" 
                                style={{ background: 'linear-gradient(135deg, var(--indigo-500), var(--purple))', border: 'none', borderRadius: '8px', padding: '0.6rem 1.2rem', width: '100%', fontWeight: 600 }}
                                onClick={handleEscalate}
                                disabled={isStreaming}
                              >
                                Create Support Ticket
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Citations and Rating block */}
                        {msg.role === 'assistant' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', width: '100%' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              ResolveAI Assistant
                            </div>
                            
                            {/* Rating Buttons */}
                            {msg.id && msg.id !== 'streaming-temp' && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button 
                                  onClick={() => handleRate(msg.id, 'helpful')}
                                  style={{ 
                                    background: msg.feedback === 'helpful' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                    border: '1px solid',
                                    borderColor: msg.feedback === 'helpful' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '6px', 
                                    padding: '4px 8px', 
                                    cursor: 'pointer', 
                                    fontSize: '0.8rem',
                                    color: msg.feedback === 'helpful' ? '#34d399' : 'var(--text-muted)',
                                    transition: 'all 0.2s'
                                  }}
                                  title="Helpful"
                                >
                                  👍
                                </button>
                                <button 
                                  onClick={() => handleRate(msg.id, 'not-helpful')}
                                  style={{ 
                                    background: msg.feedback === 'not-helpful' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                    border: '1px solid',
                                    borderColor: msg.feedback === 'not-helpful' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '6px', 
                                    padding: '4px 8px', 
                                    cursor: 'pointer', 
                                    fontSize: '0.8rem',
                                    color: msg.feedback === 'not-helpful' ? '#f87171' : 'var(--text-muted)',
                                    transition: 'all 0.2s'
                                  }}
                                  title="Not Helpful"
                                >
                                  👎
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {isStreaming && (
                    <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--indigo-300)', fontSize: '0.85rem', padding: '0 1.25rem' }}>
                      <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', animation: 'pulse 1.5s infinite' }}></span>
                      <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', animation: 'pulse 1.5s infinite 0.2s' }}></span>
                      <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', animation: 'pulse 1.5s infinite 0.4s' }}></span>
                      AI is typing...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="chat-input-area">
                  <form onSubmit={handleSendMessage} className="chat-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Ask a question based on your documents or say 'I need a refund'..." 
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        disabled={isStreaming}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <button type="submit" className="btn-send" disabled={isStreaming || !inputValue.trim()} style={{ flexShrink: 0 }}>
                      Send
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>💬</div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No Conversation Selected</h3>
                <p style={{ margin: 0 }}>Select an existing chat or start a new one to begin.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'tickets' ? (
        /* MY TICKETS TAB */
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div className="tickets-header">
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>Support Tickets</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Track the status of your requests</p>
            </div>
            <button
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, var(--indigo-500), var(--purple))', border: 'none', borderRadius: '9999px', padding: '0.6rem 1.5rem', fontWeight: 600, boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }}
              onClick={() => setShowModal(true)}
            >
              + New Ticket
            </button>
          </div>

          {ticketsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading tickets...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {tickets.length > 0 ? tickets.map(ticket => (
                <div 
                  key={ticket._id || ticket.id} 
                  className="ticket-glass-card" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/tickets/${ticket._id || ticket.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>#{ticket.id.slice(-6).toUpperCase()}</span>
                    <span className={`badge ${ticket.status === 'open' ? 'badge-glow-open' : ticket.status === 'resolved' ? 'badge-glow-resolved' : 'status-progress'}`} style={{ borderRadius: '9999px', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      {ticket.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>{ticket.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                    {ticket.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                    <span>Opened on {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'rgba(30, 41, 59, 0.3)', borderRadius: '24px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🎫</div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No tickets yet</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>You haven't opened any support tickets.</p>
                </div>
              )}
            </div>
          )}

          {/* Premium Glass Modal */}
          {showModal && (
            <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)' }}>
              <div className="modal-content" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Create New Ticket</h2>
                  <button className="btn-close" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>&times;</button>
                </div>
                <form onSubmit={handleCreateTicket} className="auth-form" style={{ marginTop: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Title</label>
                    <input
                      required
                      type="text"
                      className="form-input"
                      style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="E.g. Unable to login"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Description</label>
                    <textarea
                      required
                      className="form-input"
                      style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', resize: 'vertical' }}
                      rows={5}
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Please describe your issue in detail..."
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <button type="button" className="btn btn-secondary" style={{ borderRadius: '9999px', padding: '0.6rem 1.5rem', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--indigo-500), var(--purple))', border: 'none', borderRadius: '9999px', padding: '0.6rem 1.5rem', fontWeight: 600, boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }} disabled={createLoading}>
                      {createLoading ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* KNOWLEDGE BASE TAB */
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div className="tickets-header">
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>Help Center</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Browse articles, guides, and policies</p>
            </div>
          </div>

          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', pointerEvents: 'none' }}>🔍</span>
              <input
                type="search"
                placeholder="Search articles..."
                value={kbSearch}
                onChange={e => setKbSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['All', ...Array.from(new Set(kbArticles.map(a => a.category).filter(Boolean)))].map(cat => (
                <button
                  key={cat}
                  onClick={() => setKbCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '99px',
                    border: '1px solid',
                    borderColor: kbCategory === cat ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)',
                    background: kbCategory === cat ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                    color: kbCategory === cat ? '#a5b4fc' : 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: kbCategory === cat ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Articles Grid */}
          {kbLoading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading articles...</div>
          ) : (() => {
            const filtered = kbArticles.filter(a => {
              const matchCat = kbCategory === 'All' || a.category === kbCategory;
              const matchSearch = !kbSearch || a.title.toLowerCase().includes(kbSearch.toLowerCase()) || (a.content || '').toLowerCase().includes(kbSearch.toLowerCase());
              return matchCat && matchSearch;
            });
            return filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(30, 41, 59, 0.3)', borderRadius: '24px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📚</div>
                <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>No articles found</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>Try adjusting your search or filter.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {filtered.map(article => {
                  const catColors = {
                    'Returns & Exchanges': { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  text: '#93c5fd', icon: '🔄' },
                    'Refunds':            { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  text: '#6ee7b7', icon: '💰' },
                    'Payments':           { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  text: '#fcd34d', icon: '💳' },
                    'Troubleshooting':    { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   text: '#fca5a5', icon: '🔧' },
                    'Shipping':           { bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.25)',  text: '#c4b5fd', icon: '🚚' },
                    'Product':            { bg: 'rgba(236,72,153,0.1)',  border: 'rgba(236,72,153,0.25)',  text: '#f9a8d4', icon: '📖' },
                    'Policies':           { bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.25)',  text: '#a5b4fc', icon: '📋' },
                    'FAQ':                { bg: 'rgba(20,184,166,0.1)', border: 'rgba(20,184,166,0.25)', text: '#5eead4', icon: '❓' },
                  };
                  const theme = catColors[article.category] || { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: 'var(--text-secondary)', icon: '📄' };
                  const preview = (article.content || '').replace(/#+\s/g, '').replace(/\*\*/g, '').replace(/\n/g, ' ').slice(0, 120) + '...';
                  return (
                    <div
                      key={article.id || article._id}
                      onClick={() => setSelectedArticle(article)}
                      style={{
                        background: 'rgba(15,23,42,0.6)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '16px',
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = ''; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                          {theme.icon}
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '99px', padding: '2px 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {article.category || 'General'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, margin: 0 }}>{article.title}</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, flex: 1 }}>{preview}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <span>👁 {article.views || 0} views</span>
                        <span style={{ color: theme.text, fontWeight: 600 }}>Read more →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Article Reader Modal */}
          {selectedArticle && (
            <div className="modal-overlay" style={{ background: 'rgba(8,9,16,0.85)', backdropFilter: 'blur(10px)', zIndex: 999, alignItems: 'flex-start', paddingTop: '5vh', overflowY: 'auto' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', width: '100%', maxWidth: '720px', margin: '0 auto 5vh', padding: '2rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--indigo-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{selectedArticle.category}</span>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '8px 0 0', lineHeight: 1.25, color: 'var(--text-primary)' }}>{selectedArticle.title}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', color: 'var(--text-secondary)', flexShrink: 0 }}
                  >×</button>
                </div>
                <div style={{ height: '1px', background: 'var(--border)', marginBottom: '1.5rem' }} />
                <div style={{ fontSize: '14.5px', lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {(selectedArticle.content || '').split('\n').map((line, i) => {
                    if (line.startsWith('## '))  return <h2 key={i} style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '1.5rem 0 0.5rem' }}>{line.slice(3)}</h2>;
                    if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '1.25rem 0 0.4rem' }}>{line.slice(4)}</h3>;
                    if (line.startsWith('- '))  return <li key={i} style={{ marginLeft: '1.2rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>{line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}</li>;
                    if (line.startsWith('> '))  return <blockquote key={i} style={{ borderLeft: '3px solid var(--indigo-500)', paddingLeft: '12px', color: 'var(--text-muted)', margin: '8px 0', fontStyle: 'italic' }}>{line.slice(2)}</blockquote>;
                    if (line.trim() === '')     return <div key={i} style={{ height: '8px' }} />;
                    return <p key={i} style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>{line.replace(/\*\*(.*?)\*\*/g, (_, m) => m)}</p>;
                  })}
                </div>
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Was this article helpful?</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ padding: '6px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '99px', color: '#6ee7b7', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>👍 Yes</button>
                    <button style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '99px', color: '#fca5a5', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>👎 No</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerChat;
