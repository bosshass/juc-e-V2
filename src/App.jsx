import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { useState, useEffect } from 'react';

function AppContent() {
  const APP_VERSION = '4.9';
  
  // What's New - UPDATE THIS WITH EACH RELEASE
  const WHATS_NEW = [
    "📊 Customer Database: 358 customers from Google Sheets",
    "🔍 Autocomplete: Type to search by name or CS#",
    "🔗 CMS Match: Signals auto-link to customers by CS#",
    "📧 CMS: Reads from monitoring-center-notifications label"
  ];

  // Browser Push Notifications
  const sendNotification = (title, body) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  // Handle expired token / auth errors
  const handleAuthError = (response) => {
    if (response.status === 401) {
      alert('Session expired. Please log in again.');
      localStorage.clear();
      window.location.reload();
      return true;
    }
    return false;
  };

  useEffect(() => {
    const storedVersion = localStorage.getItem('appVersion');
    if (storedVersion !== APP_VERSION) {
      localStorage.clear();
      localStorage.setItem('appVersion', APP_VERSION);
      window.location.reload();
    }
  }, []);

  const [accessToken, setAccessToken] = useState(() => {
  return localStorage.getItem('googleAccessToken');
});
const [userEmail, setUserEmail] = useState(() => {
  return localStorage.getItem('googleUserEmail');
});

  // What's New modal state
  const [showWhatsNew, setShowWhatsNew] = useState(() => {
    const lastSeen = localStorage.getItem('lastSeenWhatsNew');
    return lastSeen !== APP_VERSION;
  });

  const dismissWhatsNew = () => {
    localStorage.setItem('lastSeenWhatsNew', APP_VERSION);
    setShowWhatsNew(false);
  };

  // Role-based access system
  const [adminUnlocked, setAdminUnlocked] = useState(() => {
    return localStorage.getItem('adminUnlocked') === 'true';
  });
  const [viewAs, setViewAs] = useState(() => {
    return localStorage.getItem('viewAs') || 'admin';
  });
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // Determine user's base role from email
  const getUserRole = (email) => {
    if (!email) return 'tech';
    const lowerEmail = email.toLowerCase();
    
    if (lowerEmail === 'info@drhsecurityservices.com') return 'superadmin';
    if (lowerEmail === 'shanaparks@drhsecurityservices.com') return 'command';
    if (lowerEmail === 'accounting@drhsecurityservices.com') return 'command'; // CMS access
    if (lowerEmail === 'jr@drhsecurityservices.com') return 'owner';
    if (lowerEmail.endsWith('@drhsecurityservices.com')) return 'tech';
    
    // External emails (like sara's personal) - treat as admin for now
    return 'admin';
  };

  const baseRole = getUserRole(userEmail);
  
  // For superadmin, check if unlocked and what view they're using
  const effectiveRole = baseRole === 'superadmin' 
    ? (adminUnlocked ? viewAs : 'locked') 
    : baseRole;

  // Role-based permissions
  const canSeeFieldExecution = ['tech', 'owner', 'admin', 'superadmin'].includes(effectiveRole) && effectiveRole !== 'locked';
  const canSeeCommandCenter = ['command', 'owner', 'admin'].includes(effectiveRole) || (baseRole === 'superadmin' && adminUnlocked && ['command', 'owner', 'admin'].includes(viewAs));
  const canSeeCustomerCare = ['command', 'admin'].includes(effectiveRole) || (baseRole === 'superadmin' && adminUnlocked && ['command', 'admin'].includes(viewAs));
  const canSeeDashboard = ['owner', 'admin'].includes(effectiveRole) || (baseRole === 'superadmin' && adminUnlocked && ['owner', 'admin'].includes(viewAs));
  const canToggleView = baseRole === 'superadmin' && adminUnlocked;
  
  // Legacy compatibility
  const isTech = effectiveRole === 'tech';
  const isAdmin = ['admin', 'owner', 'command'].includes(effectiveRole) || (baseRole === 'superadmin' && adminUnlocked);
  const isDispatcher = ['command', 'admin'].includes(effectiveRole) || (baseRole === 'superadmin' && adminUnlocked && ['command', 'admin'].includes(viewAs));

  // Check for superadmin needing password
  useEffect(() => {
    if (baseRole === 'superadmin' && !adminUnlocked && accessToken) {
      setShowPasswordPrompt(true);
    }
  }, [baseRole, adminUnlocked, accessToken]);

  // Handle password submission
  const handlePasswordSubmit = () => {
    if (passwordInput === '1986') {
      setAdminUnlocked(true);
      localStorage.setItem('adminUnlocked', 'true');
      setShowPasswordPrompt(false);
      setPasswordInput('');
    } else {
      alert('Incorrect password');
      setPasswordInput('');
    }
  };

  // Handle view toggle
  const handleViewToggle = (newView) => {
    setViewAs(newView);
    localStorage.setItem('viewAs', newView);
  };

  const [showJobs, setShowJobs] = useState(false);
  const [todaysJobs, setTodaysJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showReturnVisit, setShowReturnVisit] = useState(false);
  const [returnVisitJob, setReturnVisitJob] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // NEW: filter by work status
  const [showActions, setShowActions] = useState(false);
  const [completedActions, setCompletedActions] = useState([]);
  const [dayView, setDayView] = useState('today');
  const [showPastJobs, setShowPastJobs] = useState(false);
  const [pastJobsDate, setPastJobsDate] = useState('');
  const [showToBeBilled, setShowToBeBilled] = useState(false);
  const [toBeBilledJobs, setToBeBilledJobs] = useState([]);
  const [billingDaysBack, setBillingDaysBack] = useState(30);
  const [editingNotes, setEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  // Billing Action Modal State
  const [showBillingAction, setShowBillingAction] = useState(false);
  const [billingActionJob, setBillingActionJob] = useState(null);
  const [billingActionNotes, setBillingActionNotes] = useState('');

  // Job Completion Form State
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [completionJob, setCompletionJob] = useState(null);
  const [completionMode, setCompletionMode] = useState('complete'); // 'complete', 'sales', 'return', 'nocharge'
  const [completionData, setCompletionData] = useState({
    timeIn: '',
    timeOut: '',
    materials: '',
    billingNotes: '',
    returnReason: ''
  });
  
  // Tech Disposition Modal State
  const [showDispositionModal, setShowDispositionModal] = useState(false);
  const [dispositionJob, setDispositionJob] = useState(null);
  
  const [showTasks, setShowTasks] = useState(false);
  const [tasks, setTasks] = useState([]);

  // Dispatch State
  const [showDispatch, setShowDispatch] = useState(false);
  const [dispatchTab, setDispatchTab] = useState('queue');
  const [queueJobs, setQueueJobs] = useState([]);
  const [austinJobs, setAustinJobs] = useState([]);
  const [jrJobs, setJrJobs] = useState([]);
  const [saraJobs, setSaraJobs] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignJob, setAssignJob] = useState(null);
  const [assignTarget, setAssignTarget] = useState('austin');
  const [assignData, setAssignData] = useState({
    date: '',
    time: '09:00',
    duration: '2',
    notes: ''
  });
  const [showDeadConfirm, setShowDeadConfirm] = useState(false);
  const [deadConfirmJob, setDeadConfirmJob] = useState(null);
  const [queueDaysBack, setQueueDaysBack] = useState(90);
  const [returnNeededJobs, setReturnNeededJobs] = useState([]);
  const [showSalesQueue, setShowSalesQueue] = useState(false);
  const [salesQueueJobs, setSalesQueueJobs] = useState([]);
  
  // New Service Call Form
  const [showNewServiceCall, setShowNewServiceCall] = useState(false);
  const [newServiceData, setNewServiceData] = useState({
    customerName: '',
    phone: '',
    address: '',
    issue: '',
    priority: 'normal',
    source: 'phone'
  });
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customerDatabase, setCustomerDatabase] = useState([]);
  
  // Sales Queue Detail View
  const [selectedSalesJob, setSelectedSalesJob] = useState(null);
  
  // CMS Monitoring Signals
  const [showSignals, setShowSignals] = useState(false);
  const [cmsSignals, setCmsSignals] = useState([]);
  const [showAddSignal, setShowAddSignal] = useState(false);
  const [newSignal, setNewSignal] = useState({
    customer: '',
    zone: '',
    signalType: 'Trbl Signal',
    address: '',
    phone: '',
    csNumber: ''
  });

  // Handle browser back button/gesture
  useEffect(() => {
    const handlePopState = () => {
      if (showAssignModal) { setShowAssignModal(false); setAssignJob(null); }
      else if (showDeadConfirm) { setShowDeadConfirm(false); setDeadConfirmJob(null); }
      else if (showCompletionForm) { setShowCompletionForm(false); setCompletionJob(null); }
      else if (showDispositionModal) { setShowDispositionModal(false); setDispositionJob(null); }
      else if (showNewServiceCall) { setShowNewServiceCall(false); }
      else if (showAddSignal) { setShowAddSignal(false); }
      else if (showSignals) { setShowSignals(false); }
      else if (selectedSalesJob) { setSelectedSalesJob(null); }
      else if (selectedJob) { setSelectedJob(null); }
      else if (showReturnVisit) { setShowReturnVisit(false); setReturnVisitJob(null); }
      else if (showDispatch) { setShowDispatch(false); }
      else if (showSalesQueue) { setShowSalesQueue(false); }
      else if (showToBeBilled) { setShowToBeBilled(false); }
      else if (showPastJobs) { setShowPastJobs(false); }
      else if (showTasks) { setShowTasks(false); }
      else if (showJobs) { setShowJobs(false); }
      else { window.history.back(); }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showAssignModal, showDeadConfirm, showCompletionForm, showDispositionModal, showNewServiceCall, selectedJob, showReturnVisit, showDispatch, showSalesQueue, showToBeBilled, showPastJobs, showTasks, showJobs, showSignals, showAddSignal, selectedSalesJob]);

  // Push history state when entering views
  useEffect(() => {
    if (showJobs || showTasks || showPastJobs || showToBeBilled || showDispatch || showReturnVisit || selectedJob || showCompletionForm || showAssignModal || showDispositionModal || showNewServiceCall || showSalesQueue || showSignals || selectedSalesJob) {
      window.history.pushState({ app: true }, '');
    }
  }, [showJobs, showTasks, showPastJobs, showToBeBilled, showDispatch, showReturnVisit, selectedJob, showCompletionForm, showAssignModal, showDispositionModal, showNewServiceCall, showSalesQueue, showSignals, selectedSalesJob]);

  const weeklyActions = [
    { id: 1, text: 'Add customer name to Thursday "Confirmed" calendar entry', priority: 'high' },
    { id: 2, text: 'Schedule Raintree - Monday 8am-5pm (Austin)', priority: 'high' },
    { id: 3, text: 'Verify Dale Thompson Tuesday OR move Heiken there', priority: 'medium' },
    { id: 4, text: 'Change Jeanneret Wed from Sara task to confirmed work', priority: 'medium' }
  ];

  const quickLinks = [
    { name: 'CMS', url: 'https://www.cms-compass.com/Account/Login?ReturnUrl=%2FLocations%3FlocationId%3D500110669%26systemId%3D500118591#/Contacts', color: '#dc2626' },
    { name: 'Alula', url: 'https://www.alulaconnect.com/en/auth/login?redirect_to=%2Fen%2Fd%2Fdashboard%2Fbusiness-insights', color: '#2563eb' },
    { name: 'Slack', url: 'https://highsidesecurity.slack.com', color: '#4a154b' }
  ];

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      setAccessToken(response.access_token);
      
      const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${response.access_token}` }
      });
      const userData = await userInfo.json();
      setUserEmail(userData.email);
      localStorage.setItem('googleAccessToken', response.access_token);
      localStorage.setItem('googleUserEmail', userData.email);

      alert('Logged in as ' + userData.email);
      requestNotificationPermission();
    },
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.readonly'
  });

  const toggleAction = (actionId) => {
    if (completedActions.includes(actionId)) {
      setCompletedActions(completedActions.filter(id => id !== actionId));
    } else {
      setCompletedActions([...completedActions, actionId]);
    }
  };
const SHEET_ID = '1aT7qG75PNhPQ6o-q81RHjYokOw1H-Z8bgZDQGS1pseg';

  const fetchTasks = async () => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A2:F100`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      if (handleAuthError(response)) return;
      const data = await response.json();
      if (data.values) {
        const userName = userEmail.toLowerCase().includes('austin') ? 'Austin' 
          : userEmail.toLowerCase().includes('info') ? 'Sara'
          : userEmail.toLowerCase().includes('jr') ? 'JR'
          : userEmail.toLowerCase().includes('shana') ? 'Shana' : 'Unknown';
        
        const myTasks = data.values
          .map((row, index) => ({
            rowIndex: index + 2,
            text: row[0] || '',
            priority: row[1] || '',
            permission: row[2] || '',
            assignedTo: row[3] || '',
            completedBy: row[4] || '',
            completedAt: row[5] || ''
          }))
          .filter(task => {
            if (task.completedBy) return false;
            const assigned = task.assignedTo.toLowerCase();
            const email = userEmail.toLowerCase();
            return assigned === 'all' ||
                   assigned === email ||
                   assigned.includes(email.split('@')[0]) ||
                   email.includes(assigned.split('@')[0]);
          });
        setTasks(myTasks);
      }
      setShowTasks(true);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert('Error loading tasks');
    }
  };

  const completeTask = async (task) => {
    const userName = userEmail.toLowerCase().includes('austin') ? 'Austin' 
      : userEmail.toLowerCase().includes('info') ? 'Sara'
      : userEmail.toLowerCase().includes('jr') ? 'JR'
      : userEmail.toLowerCase().includes('shana') ? 'Shana' : 'Unknown';
    
    const now = new Date().toLocaleString();
    
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/E${task.rowIndex}:F${task.rowIndex}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [[userName, now]]
          })
        }
      );
      alert('Task completed! ✅');
      setTasks(tasks.filter(t => t.rowIndex !== task.rowIndex));
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Error completing task');
    }
  };
  // Opens the New Service Call form
  const openNewServiceCall = () => {
    setNewServiceData({
      customerName: '',
      phone: '',
      address: '',
      issue: '',
      priority: 'normal',
      source: 'phone'
    });
    setShowSuggestions(false);
    setCustomerSuggestions([]);
    setShowNewServiceCall(true);
  };

  // Submit new service call
  const submitNewServiceCall = async () => {
    if (!newServiceData.customerName.trim()) {
      alert('Customer name is required');
      return;
    }

    const priorityTags = {
      urgent: '🔴 URGENT',
      high: '🟠 HIGH',
      normal: '',
      low: '🟢 LOW'
    };

    const sourceTags = {
      phone: '📞 Phone',
      email: '📧 Email',
      walkin: '🚶 Walk-in',
      monitoring: '📡 Monitoring',
      referral: '👥 Referral'
    };

    const priorityPrefix = priorityTags[newServiceData.priority] ? `${priorityTags[newServiceData.priority]} ` : '';
    
    const event = {
      summary: `[SERVICE] - QUEUE - ${priorityPrefix}${newServiceData.customerName}`,
      description: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 NEW SERVICE CALL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Customer: ${newServiceData.customerName}
📞 Phone: ${newServiceData.phone || 'N/A'}
📍 Address: ${newServiceData.address || 'N/A'}
📥 Source: ${sourceTags[newServiceData.source]}
⚡ Priority: ${newServiceData.priority.toUpperCase()}

🔧 ISSUE:
${newServiceData.issue || 'Not specified'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Logged: ${new Date().toLocaleString()}
👤 By: ${userEmail}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      location: newServiceData.address || '',
      start: {
        dateTime: new Date().toISOString(),
        timeZone: 'America/Denver'
      },
      end: {
        dateTime: new Date(Date.now() + 2*60*60*1000).toISOString(),
        timeZone: 'America/Denver'
      }
    };

    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDARS.SERVICE_QUEUE)}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (response.ok) {
        alert('✅ Service call logged!');
        setShowNewServiceCall(false);
        sendNotification('New Service Call', `${newServiceData.customerName} added to queue`);
      } else {
        alert('Error: ' + response.status);
      }
    } catch (error) {
      console.error('Error creating service call:', error);
      alert('Error creating service call');
    }
  };

  // Legacy function for backward compatibility
  const createServiceCall = () => {
    openNewServiceCall();
  };

  const getCalendarColor = (calendarId) => {
    const colors = {
      'c_c84c0a24e2a7386cb519b21569fbb4b17a19214ce33744a63e06394f8c57339f@group.calendar.google.com': '#16a34a',
      'drhhsscalendar@gmail.com': '#9333ea',
      'do0i4f1jqbbakd72mpgpll9m6g@group.calendar.google.com': '#2563eb',
      'drhservicetech1@gmail.com': '#0891b2',
      'd40cddebd7123740ee0eece402546f83806bce96424423535bb15f6ed5abb7c6@group.calendar.google.com': '#f59e0b',
      'de3d433f5c6c6a85f5474648e005cac43529d5bed542b74675a37a30cf0ece91@group.calendar.google.com': '#dc2626',
      'c_aa764bfa5d492c689c26e3ed589df2804a04ee175db1b68d48217bd18883d178@group.calendar.google.com': '#ec4899'
    };
    return colors[calendarId] || '#6b7280';
  };

  const getCalendarName = (calendarId) => {
    const names = {
      'c_c84c0a24e2a7386cb519b21569fbb4b17a19214ce33744a63e06394f8c57339f@group.calendar.google.com': 'Sales Call',
      'drhhsscalendar@gmail.com': 'Return Visit',
      'do0i4f1jqbbakd72mpgpll9m6g@group.calendar.google.com': 'JR Appointment',
      'drhservicetech1@gmail.com': 'DRH Tech 1',
      'd40cddebd7123740ee0eece402546f83806bce96424423535bb15f6ed5abb7c6@group.calendar.google.com': 'Installation',
      'de3d433f5c6c6a85f5474648e005cac43529d5bed542b74675a37a30cf0ece91@group.calendar.google.com': 'Service Queue',
      'c_aa764bfa5d492c689c26e3ed589df2804a04ee175db1b68d48217bd18883d178@group.calendar.google.com': 'Estimate Needed'
    };
    return names[calendarId] || 'Event';
  };

  const getJobUrgency = (job) => {
    const urgencyCalendars = [
      "de3d433f5c6c6a85f5474648e005cac43529d5bed542b74675a37a30cf0ece91@group.calendar.google.com",
      "drhhsscalendar@gmail.com",
      "c_aa764bfa5d492c689c26e3ed589df2804a04ee175db1b68d48217bd18883d178@group.calendar.google.com"
    ];
    if (!urgencyCalendars.includes(job.calendarId)) return null;
    if (job.summary && job.summary.toUpperCase().includes("URGENT")) return "red";
    const created = new Date(job.created);
    const now = new Date();
    const hoursOld = (now - created) / (1000 * 60 * 60);
    if (hoursOld >= 48) return "red";
    if (hoursOld >= 24) return "yellow";
    return "green";
  };

  // NEW: Get WORK status - shows what actually happened, not just calendar timing
  const getJobWorkStatus = (job) => {
    const now = new Date();
    const jobTime = new Date(job.start?.dateTime || job.start?.date);
    const isComplete = job.summary?.includes('[COMPLETE]');
    const isInvoiced = job.summary?.includes('[INVOICED]') || job.summary?.includes('[BILLED]');
    const isNoCharge = job.summary?.includes('[NC]');
    const hasCompletionNotes = job.description?.includes('JOB COMPLETED') || job.description?.includes('SALES FOLLOW-UP');
    const hasBillingNotes = job.description?.includes('BILLING NOTES:') && !job.description?.includes('BILLING NOTES:\nNone');
    
    // Already billed - done
    if (isInvoiced) {
      return { status: 'billed', label: '💵 BILLED', color: '#6b7280', bgColor: '#f3f4f6' };
    }
    
    // No charge - done
    if (isNoCharge) {
      return { status: 'nc', label: '🚫 NC', color: '#6b7280', bgColor: '#f3f4f6' };
    }
    
    // Complete with billing notes - ready to bill (ORANGE)
    if (isComplete && hasBillingNotes) {
      return { status: 'ready-to-bill', label: '💰 READY TO BILL', color: '#ea580c', bgColor: '#fff7ed' };
    }
    
    // Complete but no billing notes - needs Sara's review (GREEN)
    if (isComplete && !hasBillingNotes) {
      return { status: 'needs-review', label: '👀 NEEDS REVIEW', color: '#16a34a', bgColor: '#f0fdf4' };
    }
    
    // Past appointment time but NOT complete - THIS IS THE PROBLEM (RED)
    if (jobTime < now && !isComplete) {
      return { status: 'overdue', label: '🔴 NOT COMPLETED', color: '#dc2626', bgColor: '#fef2f2' };
    }
    
    // Future or today - scheduled (PINK)
    return { status: 'scheduled', label: '📅 SCHEDULED', color: '#db2777', bgColor: '#fdf2f8' };
  };

  const extractPhone = (job) => {
    const desc = job.description || '';
    const phoneMatch = desc.match(/Phone:\s*([^<\n]+)/i);
    return phoneMatch ? phoneMatch[1].trim() : null;
  };

  const extractAddress = (job) => {
    if (job.location) return job.location;
    const desc = job.description || '';
    const addressMatch = desc.match(/Address:\s*([^<\n]+)/i);
    return addressMatch ? addressMatch[1].trim() : null;
  };

  // Extract customer name from job summary
  const extractCustomerName = (job) => {
    if (!job.summary) return null;
    return job.summary
      .replace(/\[SERVICE\]/gi, '')
      .replace(/\[COMPLETE\]/gi, '')
      .replace(/\[SCHEDULED\]/gi, '')
      .replace(/\[ESTIMATE\]/gi, '')
      .replace(/\[ESTIMATE NEEDED\]/gi, '')
      .replace(/\[ESTIMATE SENT\]/gi, '')
      .replace(/\[FOLLOW UP\]/gi, '')
      .replace(/\[RETURN NEEDED\]/gi, '')
      .replace(/\[DEAD\]/gi, '')
      .replace(/\[LOST\]/gi, '')
      .replace(/- QUEUE -/gi, '')
      .replace(/QUEUE -/gi, '')
      .replace(/🔴|🟡|🟢|⚪/g, '')
      .trim();
  };

  // Build customer database from calendar events
  const buildCustomerDatabase = (jobs) => {
    const customerMap = new Map();
    
    jobs.forEach(job => {
      const name = extractCustomerName(job);
      if (!name || name.length < 2) return;
      
      const phone = extractPhone(job) || '';
      const address = extractAddress(job) || '';
      
      // Use name as key, keep most recent info
      const existing = customerMap.get(name.toLowerCase());
      if (!existing || (phone && !existing.phone) || (address && !existing.address)) {
        customerMap.set(name.toLowerCase(), {
          name: name,
          phone: phone || existing?.phone || '',
          address: address || existing?.address || ''
        });
      }
    });
    
    return Array.from(customerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Filter suggestions based on input
  const filterCustomerSuggestions = (input) => {
    if (!input || input.length < 2) {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    const searchTerm = input.toLowerCase();
    const matches = customerDatabase.filter(c => 
      c.name.toLowerCase().includes(searchTerm) ||
      c.cs_id.toLowerCase().includes(searchTerm)
    ).slice(0, 8); // Max 8 suggestions
    
    setCustomerSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  };

  // Lookup customer by CS_ID
  const lookupCustomerByCs = (csNumber) => {
    if (!csNumber || customerDatabase.length === 0) return null;
    return customerDatabase.find(c => 
      c.cs_id.toLowerCase() === csNumber.toLowerCase() ||
      c.cs_id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === csNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    );
  };

  // Enrich CMS signal with customer database info
  const enrichSignalWithCustomer = (signal) => {
    const customer = lookupCustomerByCs(signal.csNumber);
    if (customer) {
      return {
        ...signal,
        customer: customer.name || signal.customer,
        phone: signal.phone || customer.phone,
        address: signal.address || customer.address,
        matchedCustomer: customer
      };
    }
    return signal;
  };

  // Select a customer from suggestions
  const selectCustomerSuggestion = (customer) => {
    setNewServiceData(prev => ({
      ...prev,
      customerName: customer.name,
      phone: customer.phone || prev.phone,
      address: customer.address || prev.address
    }));
    setShowSuggestions(false);
  };

  const updateJobNotes = async (job, newNotes) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(job.calendarId)}/events/${job.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            description: newNotes
          })
        }
      );
      
      if (response.ok) {
        alert('Notes updated! ✅');
        setEditingNotes(false);
        const updatedEvent = await response.json();
        setSelectedJob(updatedEvent);
      } else {
        alert('Error updating notes');
      }
    } catch (error) {
      console.error('Failed to update notes:', error);
      alert('Failed to update notes');
    }
  };




  // Opens the DISPOSITION MODAL - the 4-button choice
  const openDispositionModal = (job) => {
    setDispositionJob(job);
    setShowDispositionModal(true);
  };

  // Opens the completion form for a specific disposition type
  const openCompletionForm = (job, mode = 'complete') => {
    setCompletionJob(job);
    setCompletionMode(mode);
    setCompletionData({
      timeIn: '',
      timeOut: '',
      materials: '',
      billingNotes: '',
      returnReason: ''
    });
    setShowDispositionModal(false);
    setShowCompletionForm(true);
  };

  // Handle RETURN disposition - goes back to service queue
  const submitReturnDisposition = async () => {
    if (!completionJob) return;
    if (!completionData.returnReason.trim()) {
      alert('Please enter a reason for the return visit');
      return;
    }

    const returnDetails = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 RETURN VISIT NEEDED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Date: ${new Date().toLocaleDateString()}
👤 Flagged by: ${userEmail}
⏰ Time In: ${completionData.timeIn || 'Not recorded'}
⏰ Time Out: ${completionData.timeOut || 'Not recorded'}

📦 MATERIALS USED:
${completionData.materials || 'None listed'}

🔄 RETURN REASON:
${completionData.returnReason}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const newSummary = `[SERVICE] - QUEUE - ${completionJob.summary.replace('[SERVICE]', '').replace('[INSTALLATION]', '').replace('- QUEUE -', '').replace('[COMPLETE]', '').trim()}`;
    const newDesc = (completionJob.description || '') + returnDetails;

    const success = await moveEventToCalendar(completionJob, CALENDARS.SERVICE_QUEUE, newSummary, newDesc);

    if (success) {
      alert('✅ Return visit scheduled - moved to Service Queue');
      setShowCompletionForm(false);
      setCompletionJob(null);
      setSelectedJob(null);
      await viewJobs(dayView);
    } else {
      alert('Error scheduling return visit');
    }
  };

  // Handle SALE disposition - goes to estimate needed queue  
  const submitSaleDisposition = async () => {
    if (!completionJob) return;

    const saleDetails = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 SALES OPPORTUNITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Date: ${new Date().toLocaleDateString()}
👤 Flagged by: ${userEmail}
⏰ Time In: ${completionData.timeIn || 'Not recorded'}
⏰ Time Out: ${completionData.timeOut || 'Not recorded'}

📦 MATERIALS USED:
${completionData.materials || 'None listed'}

💰 SALES NOTES:
${completionData.billingNotes || 'None'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const newSummary = `[ESTIMATE NEEDED] ${completionJob.summary.replace('[SERVICE]', '').replace('[INSTALLATION]', '').replace('- QUEUE -', '').replace('[COMPLETE]', '').trim()}`;
    const newDesc = (completionJob.description || '') + saleDetails;

    const success = await moveEventToCalendar(completionJob, CALENDARS.ESTIMATE_NEEDED, newSummary, newDesc);

    if (success) {
      alert('✅ Moved to Sales/Estimate Queue');
      setShowCompletionForm(false);
      setCompletionJob(null);
      setSelectedJob(null);
      await viewJobs(dayView);
    } else {
      alert('Error moving to sales queue');
    }
  };

  // Handle SERVICE DONE disposition - marks complete for billing
  const submitServiceDoneDisposition = async () => {
    if (!completionJob) return;

    const completionDetails = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SERVICE COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Date: ${new Date().toLocaleDateString()}
👤 Completed by: ${userEmail}
⏰ Time In: ${completionData.timeIn || 'Not recorded'}
⏰ Time Out: ${completionData.timeOut || 'Not recorded'}

📦 MATERIALS USED:
${completionData.materials || 'None listed'}

💰 BILLING NOTES:
${completionData.billingNotes || 'None'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const updatedEvent = {
      summary: completionJob.summary.includes('[COMPLETE]') ? completionJob.summary : `[COMPLETE] ${completionJob.summary}`,
      description: `${completionJob.description || ''}${completionDetails}`
    };

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(completionJob.calendarId)}/events/${completionJob.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedEvent)
        }
      );

      if (response.ok) {
        alert('✅ Service complete - ready for billing!');
        setShowCompletionForm(false);
        setCompletionJob(null);
        setSelectedJob(null);
        await viewJobs(dayView);
      } else {
        alert('Error marking complete');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error marking complete');
    }
  };

  // Handle NO CHARGE disposition - goes directly to completed calendar
  const submitNoChargeDisposition = async () => {
    if (!completionJob) return;

    const noChargeDetails = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 NO CHARGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Date: ${new Date().toLocaleDateString()}
👤 Marked by: ${userEmail}
⏰ Time In: ${completionData.timeIn || 'Not recorded'}
⏰ Time Out: ${completionData.timeOut || 'Not recorded'}

📦 MATERIALS USED:
${completionData.materials || 'None listed'}

📝 NOTES:
${completionData.billingNotes || 'None'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const newSummary = `[NC] ${completionJob.summary.replace('[SERVICE]', '').replace('[INSTALLATION]', '').replace('- QUEUE -', '').replace('[COMPLETE]', '').trim()}`;
    const newDesc = (completionJob.description || '') + noChargeDetails;

    const success = await moveEventToCalendar(completionJob, CALENDARS.COMPLETED, newSummary, newDesc);

    if (success) {
      alert('✅ Marked No Charge - moved to Completed');
      setShowCompletionForm(false);
      setCompletionJob(null);
      setSelectedJob(null);
      await viewJobs(dayView);
    } else {
      alert('Error marking no charge');
    }
  };

  // Submit based on current mode
  const submitDisposition = async () => {
    switch (completionMode) {
      case 'return':
        await submitReturnDisposition();
        break;
      case 'sales':
        await submitSaleDisposition();
        break;
      case 'complete':
        await submitServiceDoneDisposition();
        break;
      case 'nocharge':
        await submitNoChargeDisposition();
        break;
      default:
        await submitServiceDoneDisposition();
    }
  };

  // Actually submits the completion with form data
  const submitCompletion = async () => {
    if (!completionJob) return;

    const completionDetails = completionMode === 'sales' 
    ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 SALES FOLLOW-UP NEEDED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Date: ${new Date().toLocaleDateString()}
👤 Flagged by: ${userEmail}
⏰ Time In: ${completionData.timeIn || 'Not recorded'}
⏰ Time Out: ${completionData.timeOut || 'Not recorded'}

📦 MATERIALS USED:
${completionData.materials || 'None listed'}

💰 BILLING NOTES:
${completionData.billingNotes || 'None'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    : `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ JOB COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Date: ${new Date().toLocaleDateString()}
👤 Completed by: ${userEmail}
⏰ Time In: ${completionData.timeIn || 'Not recorded'}
⏰ Time Out: ${completionData.timeOut || 'Not recorded'}

📦 MATERIALS USED:
${completionData.materials || 'None listed'}

💰 BILLING NOTES:
${completionData.billingNotes || 'None'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    const updatedEvent = {
      summary: completionJob.summary.includes('[COMPLETE]') ? completionJob.summary : `[COMPLETE] ${completionJob.summary}`,
      description: `${completionJob.description || ''}${completionDetails}`
    };

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(completionJob.calendarId)}/events/${completionJob.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedEvent)
        }
      );

      if (response.ok) {
        alert('Job marked complete! ✅');
        setShowCompletionForm(false);
        setCompletionJob(null);
        setSelectedJob(null);
        await viewJobs(dayView);
      } else {
        alert('Error marking complete');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error marking complete');
    }
  };
  const fetchToBeBilled = async (daysBack = 30) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - daysBack);
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    let cals = [];
    try {
      const r = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", { headers: { Authorization: "Bearer " + accessToken }});
      if (handleAuthError(r)) return;
      const data = await r.json();
      if (data.items) cals = data.items.filter(c => c.id !== userEmail).map(c => c.id);
    } catch(e) {}
    let events = [];
    for (const cal of cals) {
      try {
        const r = await fetch("https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(cal) + "/events?timeMin=" + start.toISOString() + "&timeMax=" + end.toISOString() + "&singleEvents=true&maxResults=500", { headers: { Authorization: "Bearer " + accessToken }});
        if (r.ok) { const data = await r.json(); if (data.items) events = [...events, ...data.items.map(e => ({...e, calendarId: cal}))]; }
      } catch(e) {}
    }
    const billable = events.filter(e => e.summary && e.summary.includes("[COMPLETE]") && !e.summary.includes("[INVOICED]") && !e.summary.includes("[BILLED]") && !e.summary.includes("[NC]"));
    billable.sort((a,b) => new Date(a.start.dateTime || a.start.date) - new Date(b.start.dateTime || b.start.date));
    setToBeBilledJobs(billable);
    setBillingDaysBack(daysBack);
    setShowToBeBilled(true);
  };

  // Move event from one calendar to another
  const moveEventToCalendar = async (job, targetCalendarId, newSummary, newDescription) => {
    try {
      // Create event on target calendar
      const eventData = {
        summary: newSummary,
        description: newDescription,
        start: job.start,
        end: job.end,
        location: job.location || ''
      };

      const createRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        }
      );

      if (createRes.ok) {
        // Delete from original calendar
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(job.calendarId)}/events/${job.id}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
        return true;
      }
      return false;
    } catch (e) {
      console.error('Move event error:', e);
      return false;
    }
  };

  const markAsBilled = async (job, notes = '') => {
    const invoiceNum = prompt("Enter invoice number:");
    if (!invoiceNum) return;
    
    const newSummary = `[BILLED] ${job.summary.replace("[COMPLETE]", "").replace("[SERVICE]", "").trim()}`;
    const newDesc = (job.description || "") + 
      (notes ? `\n\n📝 BILLING NOTES:\n${notes}` : '') +
      `\n\n💵 Invoice #: ${invoiceNum}\nBilled by: ${userEmail} on ${new Date().toLocaleDateString()}`;
    
    const success = await moveEventToCalendar(job, CALENDARS.COMPLETED, newSummary, newDesc);
    
    if (success) {
      setToBeBilledJobs(prev => prev.filter(j => j.id !== job.id));
      setShowBillingAction(false);
      setBillingActionJob(null);
      setBillingActionNotes('');
      alert("✅ Billed and moved to Completed: Invoice #" + invoiceNum);
    } else {
      alert("Error moving to completed calendar");
    }
  };

  const markAsNoCharge = async (job, notes = '') => {
    const newSummary = `[NC] ${job.summary.replace("[COMPLETE]", "").replace("[SERVICE]", "").trim()}`;
    const newDesc = (job.description || "") + 
      (notes ? `\n\n📝 NOTES:\n${notes}` : '') +
      `\n\n🚫 Marked NO CHARGE by: ${userEmail} on ${new Date().toLocaleDateString()}`;
    
    const success = await moveEventToCalendar(job, CALENDARS.COMPLETED, newSummary, newDesc);
    
    if (success) {
      setToBeBilledJobs(prev => prev.filter(j => j.id !== job.id));
      setShowBillingAction(false);
      setBillingActionJob(null);
      setBillingActionNotes('');
      alert("✅ Marked No Charge and moved to Completed");
    } else {
      alert("Error moving to completed calendar");
    }
  };

  const pushToServiceQueue = async (job, notes = '') => {
    if (!notes.trim()) {
      alert("Please add notes explaining why this needs to go back to the queue");
      return;
    }
    
    const newSummary = `[SERVICE] - QUEUE - ${job.summary.replace("[COMPLETE]", "").replace("[SERVICE]", "").replace("- QUEUE -", "").trim()}`;
    const newDesc = (job.description || "") + 
      `\n\n🔄 PUSHED BACK TO QUEUE:\n${notes}\nBy: ${userEmail} on ${new Date().toLocaleDateString()}`;
    
    const success = await moveEventToCalendar(job, CALENDARS.SERVICE_QUEUE, newSummary, newDesc);
    
    if (success) {
      setToBeBilledJobs(prev => prev.filter(j => j.id !== job.id));
      setShowBillingAction(false);
      setBillingActionJob(null);
      setBillingActionNotes('');
      alert("✅ Moved back to Service Queue");
    } else {
      alert("Error moving to service queue");
    }
  };

  const pushToSalesQueue = async (job, notes = '') => {
    if (!notes.trim()) {
      alert("Please add notes about the sales opportunity");
      return;
    }
    
    const newSummary = `[ESTIMATE NEEDED] ${job.summary.replace("[COMPLETE]", "").replace("[SERVICE]", "").trim()}`;
    const newDesc = (job.description || "") + 
      `\n\n💰 SALES OPPORTUNITY:\n${notes}\nFlagged by: ${userEmail} on ${new Date().toLocaleDateString()}`;
    
    const success = await moveEventToCalendar(job, CALENDARS.ESTIMATE_NEEDED, newSummary, newDesc);
    
    if (success) {
      setToBeBilledJobs(prev => prev.filter(j => j.id !== job.id));
      setShowBillingAction(false);
      setBillingActionJob(null);
      setBillingActionNotes('');
      alert("✅ Moved to Sales/Estimate Queue");
    } else {
      alert("Error moving to sales queue");
    }
  };

  // Open billing action modal
  const openBillingAction = (job) => {
    setBillingActionJob(job);
    setBillingActionNotes('');
    setShowBillingAction(true);
  };

  // Request Notes from tech via SMS
  const requestNotesFromTech = (job) => {
    const jobName = job.summary.replace("[COMPLETE]", "").replace("[SERVICE]", "").trim();
    const jobDate = new Date(job.start?.dateTime || job.start?.date).toLocaleDateString();
    const message = `JUC-E: Need notes for billing - ${jobName} (${jobDate}). Please reply with details on work performed, materials used, and billing notes.`;
    const phoneNumber = "8088541757"; // JR's phone
    
    // Open SMS app with pre-filled message
    window.open(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`, '_blank');
    
    // Mark job as notes requested
    alert("Opening SMS to request notes from JR");
  };

  // Calendar IDs
  const CALENDARS = {
    SERVICE_QUEUE: 'de3d433f5c6c6a85f5474648e005cac43529d5bed542b74675a37a30cf0ece91@group.calendar.google.com',
    DRH_TECH_1: 'drhservicetech1@gmail.com',
    JR_APPOINTMENT: 'do0i4f1jqbbakd72mpgpll9m6g@group.calendar.google.com',
    SARA_TASKS: 'info@drhsecurityservices.com', // Sara's calendar
    ESTIMATE_NEEDED: 'c_aa764bfa5d492c689c26e3ed589df2804a04ee175db1b68d48217bd18883d178@group.calendar.google.com',
    COMPLETED: 'c_a095f8a75a8e3fb1bb4b0f3a2232962af3ab55f05a49ced1e4338abcc865d3e9@group.calendar.google.com',
    SALES: 'c_c84c0a24e2a7386cb519b21569fbb4b17a19214ce33744a63e06394f8c57339f@group.calendar.google.com'
  };

  // Fetch Sales/Estimate Queue
  const fetchSalesQueue = async () => {
    try {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 90);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDARS.ESTIMATE_NEEDED)}/events?timeMin=${pastDate.toISOString()}&timeMax=${futureDate.toISOString()}&singleEvents=true&maxResults=500`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (handleAuthError(res)) return;
      if (res.ok) {
        const data = await res.json();
        const jobs = (data.items || [])
          .filter(e => e.summary && !e.summary.includes('[COMPLETE]') && !e.summary.includes('[DEAD]') && !e.summary.includes('[LOST]'))
          .map(e => ({ ...e, calendarId: CALENDARS.ESTIMATE_NEEDED }));
        jobs.sort((a, b) => new Date(a.created) - new Date(b.created));
        setSalesQueueJobs(jobs);
        setShowSalesQueue(true);
      }
    } catch (e) { 
      console.error('Sales queue fetch error:', e); 
      alert('Error loading sales queue');
    }
  };

  // Parse CMS email body to extract signal data
  const parseCmsEmail = (body, subject, timestamp) => {
    try {
      // Parse body - format from myalarms.com
      const lines = body.split('\n').map(l => l.trim()).filter(l => l);
      
      // Extract signal type (Trbl Signal, Suprv Signal, Alarm, etc.)
      let signalType = 'Trbl Signal';
      if (body.includes('Trbl Signal')) signalType = 'Trbl Signal';
      else if (body.includes('Suprv Signal')) signalType = 'Suprv Signal';
      else if (body.includes('Alarm')) signalType = 'Alarm';
      else if (body.includes('Low Battery')) signalType = 'Low Battery';
      else if (body.includes('Comm Fail') || body.includes('Communication')) signalType = 'Comm Fail';
      
      // Extract zone info
      const zoneMatch = body.match(/Zone#?\s*([^\n]+)/i);
      const zone = zoneMatch ? `Zone# ${zoneMatch[1].trim()}` : '';
      
      // Extract CS number from subject or body
      const csMatch = subject.match(/CS#?\s*([A-Z0-9]+)/i) || body.match(/([A-Z]{2,4}\d{4,})/);
      const csNumber = csMatch ? csMatch[1] : '';
      
      // Extract customer name - usually after CS# line
      const customerMatch = subject.match(/MONITORING CENTER:\s*([^,]+)/i);
      let customer = customerMatch ? customerMatch[1].trim() : '';
      
      // Try to get from body if not in subject
      if (!customer) {
        // Look for the customer name line (usually after CS#)
        const bodyLines = body.split('\n');
        for (let i = 0; i < bodyLines.length; i++) {
          if (bodyLines[i].match(/^[A-Z]{2,4}\d{4,}/) && bodyLines[i+1]) {
            customer = bodyLines[i+1].trim();
            break;
          }
        }
      }
      
      // Extract address
      const addressMatch = body.match(/(\d+[^,\n]+(?:ST|AVE|BLVD|DR|RD|WAY|CIR|LN|CT|PL)[^,\n]*)/i);
      let address = addressMatch ? addressMatch[1].trim() : '';
      
      // Try to get city/state
      const cityMatch = body.match(/([A-Z]+,\s*CO,?\s*\d{5})/i);
      if (cityMatch && address) {
        address += ', ' + cityMatch[1];
      }
      
      // Extract phone
      const phoneMatch = body.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
      const phone = phoneMatch ? phoneMatch[1] : '';
      
      return {
        id: Date.now() + Math.random(),
        customer: customer || 'Unknown Customer',
        csNumber,
        signalType,
        zone,
        address,
        phone,
        timestamp: timestamp || new Date().toISOString(),
        status: 'new',
        emailId: null,
        raw: body
      };
    } catch (e) {
      console.error('Parse error:', e);
      return null;
    }
  };

  // Track processed CMS emails in localStorage
  const [processedCmsIds, setProcessedCmsIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('processedCmsIds') || '[]');
    } catch { return []; }
  });

  // Fetch CMS monitoring signals from Gmail
  const fetchCmsSignals = async () => {
    try {
      // Search for emails in the monitoring-center-notifications label
      const query = 'label:monitoring-center-notifications';
      const searchRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      if (searchRes.status === 401 || searchRes.status === 403) {
        console.log('Gmail access not authorized - user may need to re-login');
        return;
      }
      
      if (!searchRes.ok) {
        console.error('Gmail search failed:', searchRes.status);
        return;
      }
      
      const searchData = await searchRes.json();
      const messages = searchData.messages || [];
      
      if (messages.length === 0) {
        console.log('No new CMS signals');
        return;
      }
      
      // Filter out already processed emails
      const unprocessedMessages = messages.filter(msg => !processedCmsIds.includes(msg.id));
      
      if (unprocessedMessages.length === 0) {
        console.log('No new unprocessed CMS signals');
        return;
      }
      
      const signals = [];
      
      for (const msg of unprocessedMessages.slice(0, 20)) { // Process up to 20 messages
        try {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          
          if (!msgRes.ok) continue;
          
          const msgData = await msgRes.json();
          
          // Get subject
          const subjectHeader = msgData.payload.headers.find(h => h.name.toLowerCase() === 'subject');
          const subject = subjectHeader ? subjectHeader.value : '';
          
          // Get timestamp
          const dateHeader = msgData.payload.headers.find(h => h.name.toLowerCase() === 'date');
          const timestamp = dateHeader ? new Date(dateHeader.value).toISOString() : new Date().toISOString();
          
          // Get body - handle different formats
          let body = '';
          if (msgData.payload.body && msgData.payload.body.data) {
            body = atob(msgData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          } else if (msgData.payload.parts) {
            const textPart = msgData.payload.parts.find(p => p.mimeType === 'text/plain');
            if (textPart && textPart.body && textPart.body.data) {
              body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            }
          }
          
          // Also try snippet
          if (!body && msgData.snippet) {
            body = msgData.snippet;
          }
          
          const signal = parseCmsEmail(body, subject, timestamp);
          if (signal) {
            signal.emailId = msg.id;
            signals.push(signal);
          }
        } catch (msgError) {
          console.error('Error processing message:', msgError);
        }
      }
      
      if (signals.length > 0) {
        setCmsSignals(prev => {
          // Dedupe by emailId
          const existingIds = new Set(prev.map(s => s.emailId).filter(Boolean));
          const newSignals = signals.filter(s => !existingIds.has(s.emailId));
          return [...newSignals, ...prev];
        });
      }
      
      console.log(`Fetched ${signals.length} CMS signals`);
    } catch (e) {
      console.error('CMS signals fetch error:', e);
    }
  };

  // Mark email as processed (save to localStorage so we don't show it again)
  const markEmailProcessed = (emailId) => {
    if (!emailId) return;
    setProcessedCmsIds(prev => {
      const updated = [...prev, emailId];
      // Keep only last 500 IDs to prevent localStorage bloat
      const trimmed = updated.slice(-500);
      localStorage.setItem('processedCmsIds', JSON.stringify(trimmed));
      return trimmed;
    });
  };

  // Mark email as read when signal is dismissed/converted
  const markEmailRead = async (emailId) => {
    if (!emailId) return;
    // Mark as processed so it doesn't show again
    markEmailProcessed(emailId);
    try {
      await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`,
        {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
        }
      );
    } catch (e) {
      console.error('Error marking email read:', e);
    }
  };

  // Auto-poll CMS signals every 5 minutes
  useEffect(() => {
    if (!accessToken) return;
    
    // Initial fetch after 5 seconds (give time for other things to load)
    const initialTimeout = setTimeout(() => {
      fetchCmsSignals();
    }, 5000);
    
    // Then poll every 5 minutes
    const pollInterval = setInterval(() => {
      console.log('Auto-polling CMS signals...');
      fetchCmsSignals();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(pollInterval);
    };
  }, [accessToken]);

  // Notify when new CMS signals arrive
  useEffect(() => {
    if (cmsSignals.length > 0) {
      // Check if we have new signals (ones added in last 10 seconds)
      const recentSignals = cmsSignals.filter(s => {
        const signalTime = new Date(s.timestamp).getTime();
        const now = Date.now();
        return (now - signalTime) < 10000; // 10 seconds
      });
      
      if (recentSignals.length > 0 && Notification.permission === 'granted') {
        sendNotification('📡 CMS Alert', `${recentSignals.length} new monitoring signal${recentSignals.length > 1 ? 's' : ''}`);
      }
    }
  }, [cmsSignals.length]);

  // Customer Database Google Sheet ID
  const CUSTOMER_SHEET_ID = '10O4lMhOux4wOLukQvDCpMeqkRY9PJbiMQY_OpyfR_rU';

  // Fetch customer database from Google Sheets
  useEffect(() => {
    if (!accessToken) return;
    
    const fetchCustomerDb = async () => {
      try {
        // Fetch from Google Sheets API
        const res = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${CUSTOMER_SHEET_ID}/values/Customers!A:I`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        if (!res.ok) {
          console.error('Failed to fetch customer database:', res.status);
          return;
        }
        
        const data = await res.json();
        const rows = data.values || [];
        
        if (rows.length < 2) {
          console.log('No customer data found');
          return;
        }
        
        // Skip header row, parse data
        // Columns: CS_ID, Customer_Name, Phone, Address, City, State, Zip, System_Type, CMS_Monthly
        const customers = rows.slice(1).map(row => ({
          cs_id: row[0] || '',
          name: row[1] || '',
          phone: row[2] || '',
          address: [row[3], row[4], row[5], row[6]].filter(Boolean).join(', '),
          system_type: row[7] || '',
          cms_monthly: row[8] || ''
        })).filter(c => c.name); // Filter out empty rows
        
        setCustomerDatabase(customers);
        console.log(`Loaded ${customers.length} customers from Google Sheets`);
      } catch (e) {
        console.error('Error fetching customer database:', e);
      }
    };
    
    // Fetch after short delay
    const timeout = setTimeout(fetchCustomerDb, 2000);
    return () => clearTimeout(timeout);
  }, [accessToken]);

  const fetchDispatchData = async (daysBack = queueDaysBack) => {
    // Fetch Queue (Service Queue - not complete, not dead)
    try {
      const now = new Date();
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - daysBack);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const queueRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDARS.SERVICE_QUEUE)}/events?timeMin=${pastDate.toISOString()}&timeMax=${futureDate.toISOString()}&singleEvents=true&maxResults=500`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (handleAuthError(queueRes)) return;
      if (queueRes.ok) {
        const data = await queueRes.json();
        const queue = (data.items || [])
          .filter(e => e.summary && !e.summary.includes('[COMPLETE]') && !e.summary.includes('[DEAD]') && !e.summary.includes('[SCHEDULED]'))
          .map(e => ({ ...e, calendarId: CALENDARS.SERVICE_QUEUE }));
        queue.sort((a, b) => new Date(a.created) - new Date(b.created));
        setQueueJobs(queue);
      }
    } catch (e) { console.error('Queue fetch error:', e); }

    // Fetch Austin (DRH Tech 1) - next 7 days
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() + 7);
      end.setHours(23, 59, 59, 999);

      const austinRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDARS.DRH_TECH_1)}/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (austinRes.ok) {
        const data = await austinRes.json();
        setAustinJobs((data.items || []).map(e => ({ ...e, calendarId: CALENDARS.DRH_TECH_1 })));
      }
    } catch (e) { console.error('Austin fetch error:', e); }

    // Fetch JR - next 7 days
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() + 7);
      end.setHours(23, 59, 59, 999);

      const jrRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDARS.JR_APPOINTMENT)}/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (jrRes.ok) {
        const data = await jrRes.json();
        setJrJobs((data.items || []).map(e => ({ ...e, calendarId: CALENDARS.JR_APPOINTMENT })));
      }
    } catch (e) { console.error('JR fetch error:', e); }

    // Fetch Sara - next 7 days
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() + 7);
      end.setHours(23, 59, 59, 999);

      const saraRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDARS.SARA_TASKS)}/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (saraRes.ok) {
        const data = await saraRes.json();
        setSaraJobs((data.items || []).map(e => ({ ...e, calendarId: CALENDARS.SARA_TASKS })));
      }
    } catch (e) { console.error('Sara fetch error:', e); }

    // Fetch Return Needed jobs from all calendars
    try {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 90);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      // Get all calendars
      const calRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList',
        { headers: { Authorization: `Bearer ${accessToken}` } });
      if (calRes.ok) {
        const calData = await calRes.json();
        const cals = (calData.items || []).filter(c => c.id !== userEmail).map(c => c.id);
        let returnJobs = [];
        for (const cal of cals) {
          try {
            const r = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal)}/events?timeMin=${pastDate.toISOString()}&timeMax=${futureDate.toISOString()}&singleEvents=true&maxResults=500`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (r.ok) {
              const data = await r.json();
              const returns = (data.items || [])
                .filter(e => e.summary && e.summary.includes('[RETURN NEEDED]'))
                .map(e => ({ ...e, calendarId: cal }));
              returnJobs = [...returnJobs, ...returns];
            }
          } catch (e) {}
        }
        returnJobs.sort((a, b) => new Date(a.created || a.start?.dateTime || a.start?.date) - new Date(b.created || b.start?.dateTime || b.start?.date));
        setReturnNeededJobs(returnJobs);
      }
    } catch (e) { console.error('Return needed fetch error:', e); }

    setQueueDaysBack(daysBack);
    setShowDispatch(true);
  };

  const getQueueAge = (job) => {
    const created = new Date(job.created);
    const now = new Date();
    const days = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    if (days > 30) return { color: '#dc2626', emoji: '🔴', days };
    if (days >= 7) return { color: '#f59e0b', emoji: '🟡', days };
    return { color: '#16a34a', emoji: '🟢', days };
  };

  const openAssignModal = (job, target) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setAssignJob(job);
    setAssignTarget(target);
    setAssignData({
      date: tomorrow.toISOString().split('T')[0],
      time: '09:00',
      duration: '2',
      notes: ''
    });
    setShowAssignModal(true);
  };

  const submitAssignment = async () => {
    if (!assignJob || !assignData.date) return;

    const targetCalendar = assignTarget === 'austin' ? CALENDARS.DRH_TECH_1 
                         : assignTarget === 'sara' ? CALENDARS.SARA_TASKS 
                         : CALENDARS.JR_APPOINTMENT;
    const startDateTime = new Date(`${assignData.date}T${assignData.time}`);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(assignData.duration) * 60 * 60 * 1000);

    const customerName = assignJob.summary.replace('[SERVICE]', '').replace('- QUEUE -', '').replace('QUEUE -', '').trim();
    const phone = extractPhone(assignJob) || 'N/A';
    const address = extractAddress(assignJob) || '';

    const techName = assignTarget === 'austin' ? 'Austin' : assignTarget === 'sara' ? 'Sara' : 'JR';

    const newEvent = {
      summary: customerName,
      description: `${assignJob.description || ''}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nDispatched from Queue by ${userEmail}\non ${new Date().toLocaleDateString()}\n${assignData.notes ? `Notes: ${assignData.notes}` : ''}`,
      location: address,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/Denver'
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/Denver'
      }
    };

    try {
      // Create new event on target calendar
      const createRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendar)}/events`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(newEvent)
        }
      );

      if (createRes.ok) {
        // Mark original as scheduled
        const newSummary = `[SCHEDULED] ${assignJob.summary}`;
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(assignJob.calendarId)}/events/${assignJob.id}`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ summary: newSummary })
          }
        );

        alert(`Assigned to ${techName}!`);
        sendNotification('Job Assigned', `${customerName} assigned to ${techName}`);
        setShowAssignModal(false);
        setAssignJob(null);
        await fetchDispatchData();
      } else {
        alert('Error creating event');
      }
    } catch (e) {
      console.error('Assignment error:', e);
      alert('Error assigning job');
    }
  };

  const confirmMarkDead = (job) => {
    setDeadConfirmJob(job);
    setShowDeadConfirm(true);
  };

  const markDead = async (job) => {
    const newSummary = job.summary.includes('[DEAD]') ? job.summary : `[DEAD] ${job.summary}`;
    const newDesc = (job.description || '') +
      '\n\nMarked DEAD by: ' + userEmail +
      ' on ' + new Date().toLocaleDateString() +
      '\nReason: No work performed / Customer unresponsive';
    try {
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(job.calendarId)}/events/${job.id}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary: newSummary, description: newDesc })
        }
      );
      setQueueJobs(prev => prev.filter(j => j.id !== job.id));
      setShowDeadConfirm(false);
      setDeadConfirmJob(null);
      alert('Marked as dead');
    } catch (e) { alert('Error'); }
  };

  const moveToEstimate = async (job) => {
    const customerName = job.summary.replace('[SERVICE]', '').replace('- QUEUE -', '').replace('QUEUE -', '').trim();
    const newEvent = {
      summary: `[ESTIMATE] ${customerName}`,
      description: `${job.description || ''}\n\nMoved to Estimates by ${userEmail} on ${new Date().toLocaleDateString()}`,
      location: extractAddress(job) || '',
      start: job.start,
      end: job.end
    };

    try {
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDARS.ESTIMATE_NEEDED)}/events`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(newEvent)
        }
      );
      // Mark original as moved
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(job.calendarId)}/events/${job.id}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary: `[MOVED-ESTIMATE] ${job.summary}` })
        }
      );
      alert('Moved to Estimates!');
      setQueueJobs(prev => prev.filter(j => j.id !== job.id));
    } catch (e) { alert('Error'); }
  };

  const flagReturnNeeded = async (job) => {
    const newSummary = job.summary.includes('[RETURN NEEDED]') ? job.summary : `[RETURN NEEDED] ${job.summary}`;
    const newDesc = (job.description || '') +
      '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔄 RETURN VISIT NEEDED\nFlagged by: ' + userEmail +
      ' on ' + new Date().toLocaleDateString() +
      '\nAwaiting scheduling by dispatch';
    try {
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(job.calendarId)}/events/${job.id}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary: newSummary, description: newDesc })
        }
      );
      setToBeBilledJobs(prev => prev.filter(j => j.id !== job.id));
      alert('Flagged for return visit - will appear in Dispatch');
      const customerName = job.summary.replace('[COMPLETE]', '').replace('[SERVICE]', '').replace('- QUEUE -', '').trim();
      sendNotification('Return Visit Needed', `${customerName} flagged for return`);
    } catch (e) { alert('Error flagging for return'); }
  };

  const viewJobs = async (view) => {
    let startDate = new Date();
    let endDate = new Date();
    
    if (view === 'today') {
      startDate.setHours(0,0,0,0);
      endDate.setHours(23,59,59,999);
    } else if (view === 'tomorrow') {
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(0,0,0,0);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(23,59,59,999);
    } else if (view === 'week') {
      startDate.setHours(0,0,0,0);
      endDate.setDate(endDate.getDate() + 7);
      endDate.setHours(23,59,59,999);
    }

    // Fetch all calendars the user has access to
    let calendars = [];
    try {
      const calListResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      if (handleAuthError(calListResponse)) return;
      const calListData = await calListResponse.json();
      if (calListData.items) {
        calendars = calListData.items
          .filter(cal => cal.id !== userEmail)
          .map(cal => cal.id);
      }
    } catch (error) {
      console.error('Error fetching calendar list:', error);
    }

    let allEvents = [];

    for (const calId of calendars) {
      try {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?timeMin=${startDate.toISOString()}&timeMax=${endDate.toISOString()}&orderBy=startTime&singleEvents=true`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.items) {
            const eventsWithCal = data.items.map(event => ({
              ...event,
              calendarId: calId
            }));
            allEvents = [...allEvents, ...eventsWithCal];
          }
        }
      } catch (error) {
        console.error(`Error fetching calendar:`, error);
      }
    }

    allEvents.sort((a, b) => {
      const aTime = new Date(a.start.dateTime || a.start.date);
      const bTime = new Date(b.start.dateTime || b.start.date);
      return aTime - bTime;
    });

    setTodaysJobs(allEvents);
    setDayView(view);
    setShowJobs(true);
  };

  const scheduleReturnVisit = async (job) => {
    setReturnVisitJob(job);
    setShowReturnVisit(true);
  };

  const submitReturnVisit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const returnDate = formData.get('returnDate');
    const returnTime = formData.get('returnTime');
    const notes = formData.get('notes');

    const returnDateTime = new Date(returnDate + 'T' + returnTime);
    const endDateTime = new Date(returnDateTime.getTime() + 2*60*60*1000);

    const phone = extractPhone(returnVisitJob) || 'N/A';
    const address = extractAddress(returnVisitJob) || 'N/A';

    const event = {
      summary: `[RETURN] - ${returnVisitJob.summary.replace('[SERVICE] - ', '').replace('[INSTALLATION] - ', '').replace('[SALES] - ', '').replace('QUEUE - ', '')}`,
      description: `RETURN VISIT\n\nOriginal job: ${returnVisitJob.summary}\nOriginal date: ${new Date(returnVisitJob.start.dateTime || returnVisitJob.start.date).toLocaleDateString()}\n\nCustomer Phone: ${phone}\nAddress: ${address}\n\nReason for return: ${notes}\n\nScheduled by: ${userEmail}`,
      location: address !== 'N/A' ? address : '',
      start: {
        dateTime: returnDateTime.toISOString(),
        timeZone: 'America/Denver'
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/Denver'
      }
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/drhhsscalendar@gmail.com/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (response.ok) {
      alert('Return visit scheduled! ✅');
      setShowReturnVisit(false);
      setReturnVisitJob(null);
    } else {
      alert('Error: ' + response.status);
    }
  };

  const getFilteredJobs = () => {
    let jobs = todaysJobs;
    
    // First filter by job type
    if (filterType !== 'all') {
      const filterMap = {
        'sales': 'Sales Call',
        'service': 'Service',
        'install': 'Installation',
        'return': 'Return Visit'
      };
      
      jobs = jobs.filter(job => 
        getCalendarName(job.calendarId).toLowerCase().includes(filterMap[filterType].toLowerCase()) ||
        job.summary.toLowerCase().includes(filterMap[filterType].toLowerCase())
      );
    }
    
    // Then filter by work status
    if (statusFilter !== 'all') {
      jobs = jobs.filter(job => {
        const workStatus = getJobWorkStatus(job);
        return workStatus.status === statusFilter;
      });
    }
    
    return jobs;
  };

  const QuickLinksBar = () => (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#0A2240',
      padding: '12px 20px',
      display: 'flex',
      justifyContent: 'center',
      gap: '12px',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      zIndex: 1000
    }}>
      {quickLinks.map((link, index) => (
    <a  
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '10px 20px',
            backgroundColor: link.color,
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {link.name}
        </a>
      ))}
    </div>
  );

  if (!accessToken) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0A2240 0%, #061529 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <img src="/DRH_Logo.png" alt="DRH Security" style={{ height: '80px', marginBottom: '24px' }} />
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A2240', marginBottom: '8px', fontSize: '24px' }}>JUC-E</h1>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '32px' }}>
            Job Unit Coordination Engine
          </p>
          <button 
            onClick={login}
            style={{
              width: '100%',
              padding: '16px 32px',
              fontSize: '16px',
              backgroundColor: '#C41E1E',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              fontFamily: "'Inter', sans-serif",
              boxShadow: '0 4px 12px rgba(196,30,30,0.3)'
            }}
          >
            Sign in with Google
          </button>
          <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '24px' }}>
            A Division of HighSide Security
          </p>
        </div>
      </div>
    );
  }

  // Password prompt for Super Admin (info@)
  if (showPasswordPrompt) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0A2240 0%, #061529 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <img src="/DRH_Logo.png" alt="DRH Security" style={{ height: '80px', marginBottom: '24px' }} />
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A2240', marginBottom: '8px', fontSize: '24px' }}>🔐 Admin Access</h1>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
            Enter password to continue
          </p>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            placeholder="Password"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '18px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              marginBottom: '16px',
              textAlign: 'center',
              letterSpacing: '4px'
            }}
            autoFocus
          />
          <button 
            onClick={handlePasswordSubmit}
            style={{
              width: '100%',
              padding: '16px 32px',
              fontSize: '16px',
              backgroundColor: '#C41E1E',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              marginBottom: '12px'
            }}
          >
            Unlock
          </button>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              backgroundColor: 'transparent',
              color: '#6B7280',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // What's New Modal - shows once per device per version
  if (showWhatsNew && accessToken && !showPasswordPrompt) {
    return (
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 9999
      }}>
        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '16px',
          textAlign: 'center',
          maxWidth: '340px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✨</div>
          <h2 style={{ 
            fontFamily: "'Space Grotesk', sans-serif", 
            color: '#0A2240', 
            marginBottom: '8px', 
            fontSize: '22px',
            marginTop: 0
          }}>What's New in v{APP_VERSION}</h2>
          
          <div style={{ textAlign: 'left', marginTop: '20px', marginBottom: '24px' }}>
            {WHATS_NEW.map((item, idx) => (
              <div key={idx} style={{ 
                padding: '10px 0', 
                borderBottom: idx < WHATS_NEW.length - 1 ? '1px solid #f0f0f0' : 'none',
                fontSize: '15px',
                color: '#374151'
              }}>
                {item}
              </div>
            ))}
          </div>
          
          <button 
            onClick={dismissWhatsNew}
            style={{
              width: '100%',
              padding: '16px 32px',
              fontSize: '16px',
              backgroundColor: '#C41E1E',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            Got it!
          </button>
        </div>
      </div>
    );
  }


  // Assignment Modal
  if (showAssignModal && assignJob) {
    return (
      <div style={{ padding: '20px', paddingBottom: '80px', maxWidth: '400px', margin: '0 auto', fontFamily: 'Arial' }}>
        <button onClick={() => { setShowAssignModal(false); setAssignJob(null); }} style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>← Cancel</button>
        <h2>Assign to {assignTarget === 'austin' ? 'Austin' : assignTarget === 'sara' ? 'Sara' : 'JR'}</h2>
        <div style={{ padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold' }}>{assignJob.summary.replace('[SERVICE]', '').replace('- QUEUE -', '').replace('QUEUE -', '').trim()}</div>
          {extractPhone(assignJob) && <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>📞 {extractPhone(assignJob)}</div>}
          {extractAddress(assignJob) && <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>📍 {extractAddress(assignJob)}</div>}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date:</label>
          <input type="date" value={assignData.date} onChange={(e) => setAssignData({ ...assignData, date: e.target.value })} style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }} />
        </div>

        {/* Tech's schedule for selected date */}
        {assignData.date && (
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: assignTarget === 'austin' ? '#f0f9ff' : assignTarget === 'sara' ? '#fdf2f8' : '#eff6ff', borderRadius: '5px', borderLeft: `4px solid ${assignTarget === 'austin' ? '#0891b2' : assignTarget === 'sara' ? '#ec4899' : '#2563eb'}` }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
              {assignTarget === 'austin' ? 'Austin' : assignTarget === 'sara' ? 'Sara' : 'JR'}'s schedule for {new Date(assignData.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}:
            </div>
            {(() => {
              const techJobs = assignTarget === 'austin' ? austinJobs : assignTarget === 'sara' ? saraJobs : jrJobs;
              const selectedDate = assignData.date;
              const dayJobs = techJobs.filter(job => {
                const jobDate = new Date(job.start?.dateTime || job.start?.date).toISOString().split('T')[0];
                return jobDate === selectedDate;
              }).sort((a, b) => new Date(a.start?.dateTime || a.start?.date) - new Date(b.start?.dateTime || b.start?.date));

              if (dayJobs.length === 0) {
                return <div style={{ fontSize: '14px', color: '#16a34a', fontWeight: 'bold' }}>✅ No jobs scheduled - day is open!</div>;
              }
              return dayJobs.map((job, idx) => (
                <div key={idx} style={{ fontSize: '13px', color: '#374151', marginBottom: '4px', paddingLeft: '8px', borderLeft: '2px solid #ccc' }}>
                  <span style={{ fontWeight: 'bold' }}>{new Date(job.start?.dateTime || job.start?.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                  {' - '}{job.summary?.substring(0, 30)}{job.summary?.length > 30 ? '...' : ''}
                </div>
              ));
            })()}
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Time:</label>
          <input type="time" value={assignData.time} onChange={(e) => setAssignData({ ...assignData, time: e.target.value })} style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Duration:</label>
          <select value={assignData.duration} onChange={(e) => setAssignData({ ...assignData, duration: e.target.value })} style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}>
            <option value="1">1 hour</option>
            <option value="2">2 hours</option>
            <option value="3">3 hours</option>
            <option value="4">4 hours</option>
            <option value="8">All Day</option>
          </select>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notes (optional):</label>
          <textarea value={assignData.notes} onChange={(e) => setAssignData({ ...assignData, notes: e.target.value })} rows="3" placeholder="Any special instructions..." style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc', fontFamily: 'Arial' }} />
        </div>
        <button onClick={submitAssignment} style={{ width: '100%', padding: '15px', fontSize: '18px', backgroundColor: assignTarget === 'austin' ? '#0891b2' : assignTarget === 'sara' ? '#ec4899' : '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          Assign to {assignTarget === 'austin' ? 'Austin' : assignTarget === 'sara' ? 'Sara' : 'JR'}
        </button>
      </div>
    );
  }

  // Dispatch View
  if (showDispatch) {
    const groupJobsByDate = (jobs) => {
      const groups = {};
      jobs.forEach(job => {
        const date = new Date(job.start?.dateTime || job.start?.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (!groups[date]) groups[date] = [];
        groups[date].push(job);
      });
      return groups;
    };

    return (
      <div style={{ padding: '20px', paddingBottom: '80px', maxWidth: '400px', margin: '0 auto', fontFamily: 'Arial' }}>
        {/* Dead Confirmation Modal */}
        {showDeadConfirm && deadConfirmJob && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', maxWidth: '300px', textAlign: 'center', margin: '20px' }}>
              <h3 style={{ marginTop: 0 }}>Before marking dead...</h3>
              <p>Was any work performed on this job that should be billed?</p>
              <button onClick={() => { setShowDeadConfirm(false); setShowDispatch(false); openCompletionForm(deadConfirmJob, 'complete'); }} style={{ width: '100%', padding: '12px', marginBottom: '10px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>✅ Yes, Bill It</button>
              <button onClick={() => markDead(deadConfirmJob)} style={{ width: '100%', padding: '12px', marginBottom: '10px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>☠️ No, Mark Dead</button>
              <button onClick={() => { setShowDeadConfirm(false); setDeadConfirmJob(null); }} style={{ width: '100%', padding: '12px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        <button onClick={() => setShowDispatch(false)} style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>← Back</button>
        <h2>📥 Dispatch Center</h2>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button onClick={() => setDispatchTab('queue')} style={{ flex: 1, minWidth: '60px', padding: '12px', fontSize: '13px', backgroundColor: dispatchTab === 'queue' ? '#dc2626' : '#e5e7eb', color: dispatchTab === 'queue' ? 'white' : '#374151', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: dispatchTab === 'queue' ? 'bold' : 'normal' }}>
            Queue ({queueJobs.length})
          </button>
          <button onClick={() => setDispatchTab('austin')} style={{ flex: 1, minWidth: '60px', padding: '12px', fontSize: '13px', backgroundColor: dispatchTab === 'austin' ? '#0891b2' : '#e5e7eb', color: dispatchTab === 'austin' ? 'white' : '#374151', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: dispatchTab === 'austin' ? 'bold' : 'normal' }}>
            Austin ({austinJobs.length})
          </button>
          <button onClick={() => setDispatchTab('jr')} style={{ flex: 1, minWidth: '60px', padding: '12px', fontSize: '13px', backgroundColor: dispatchTab === 'jr' ? '#2563eb' : '#e5e7eb', color: dispatchTab === 'jr' ? 'white' : '#374151', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: dispatchTab === 'jr' ? 'bold' : 'normal' }}>
            JR ({jrJobs.length})
          </button>
          <button onClick={() => setDispatchTab('sara')} style={{ flex: 1, minWidth: '60px', padding: '12px', fontSize: '13px', backgroundColor: dispatchTab === 'sara' ? '#ec4899' : '#e5e7eb', color: dispatchTab === 'sara' ? 'white' : '#374151', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: dispatchTab === 'sara' ? 'bold' : 'normal' }}>
            Sara ({saraJobs.length})
          </button>
          <button onClick={() => setDispatchTab('returns')} style={{ flex: 1, minWidth: '60px', padding: '12px', fontSize: '13px', backgroundColor: dispatchTab === 'returns' ? '#9333ea' : '#e5e7eb', color: dispatchTab === 'returns' ? 'white' : '#374151', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: dispatchTab === 'returns' ? 'bold' : 'normal' }}>
            🔄 ({returnNeededJobs.length})
          </button>
        </div>

        {/* Queue Tab */}
        {dispatchTab === 'queue' && (
          <>
            <p style={{ color: '#666', marginBottom: '10px', fontSize: '14px' }}>{queueJobs.length} items (last {queueDaysBack} days)</p>
            <button onClick={() => fetchDispatchData(queueDaysBack + 90)} style={{ width: '100%', padding: '10px', marginBottom: '15px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Load More (+90 days)</button>
            {queueJobs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f0fdf4', borderRadius: '10px' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
                <div style={{ fontSize: '18px', color: '#065f46' }}>Queue is empty!</div>
              </div>
            ) : (
              queueJobs.map(job => {
                const age = getQueueAge(job);
                const customerName = job.summary.replace('[SERVICE]', '').replace('- QUEUE -', '').replace('QUEUE -', '').trim();
                return (
                  <div key={job.id} style={{ padding: '15px', marginBottom: '10px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', borderLeft: '4px solid #dc2626' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>{new Date(job.created).toLocaleDateString()}</span>
                      <span style={{ fontSize: '12px', color: age.color, fontWeight: 'bold' }}>{age.emoji} {age.days} days</span>
                    </div>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>{customerName}</div>
                    {extractPhone(job) && <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>📞 {extractPhone(job)}</div>}
                    {extractAddress(job) && <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>📍 {extractAddress(job)}</div>}
                    
                    {/* Notes Preview */}
                    {job.description && (
                      <div style={{ fontSize: '12px', color: '#374151', marginBottom: '8px', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '6px', maxHeight: '60px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                        📝 {job.description.substring(0, 150)}{job.description.length > 150 ? '...' : ''}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button onClick={() => { openCompletionForm(job, 'complete'); setShowDispatch(false); }} style={{ width: '100%', padding: '8px', fontSize: '12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>✅ Work Completed</button>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => openAssignModal(job, 'austin')} style={{ flex: 1, padding: '8px', fontSize: '12px', backgroundColor: '#0891b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Austin</button>
                        <button onClick={() => openAssignModal(job, 'jr')} style={{ flex: 1, padding: '8px', fontSize: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>JR</button>
                        <button onClick={() => openAssignModal(job, 'sara')} style={{ flex: 1, padding: '8px', fontSize: '12px', backgroundColor: '#ec4899', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Sara</button>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => moveToEstimate(job)} style={{ flex: 1, padding: '8px', fontSize: '12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Estimate</button>
                        <button onClick={() => confirmMarkDead(job)} style={{ flex: 1, padding: '8px', fontSize: '12px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>☠️ Dead</button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* Austin Tab */}
        {dispatchTab === 'austin' && (
          <>
            {austinJobs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f0f9ff', borderRadius: '10px' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📅</div>
                <div style={{ fontSize: '18px', color: '#0369a1' }}>No jobs scheduled</div>
              </div>
            ) : (
              Object.entries(groupJobsByDate(austinJobs)).map(([date, jobs]) => (
                <div key={date}>
                  <h3 style={{ marginTop: '15px', marginBottom: '10px', paddingBottom: '5px', borderBottom: '2px solid #0891b2', color: '#0891b2' }}>{date}</h3>
                  {jobs.map(job => (
                    <div key={job.id} onClick={() => { setSelectedJob({ ...job, calendarId: CALENDARS.DRH_TECH_1 }); setShowDispatch(false); }} style={{ padding: '12px', marginBottom: '8px', backgroundColor: '#f0f9ff', borderRadius: '5px', borderLeft: '4px solid #0891b2', cursor: 'pointer' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        {new Date(job.start?.dateTime || job.start?.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#111827' }}>{job.summary}</div>
                      {extractAddress(job) && <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>📍 {extractAddress(job)}</div>}
                    </div>
                  ))}
                </div>
              ))
            )}
          </>
        )}

        {/* JR Tab */}
        {dispatchTab === 'jr' && (
          <>
            {jrJobs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#eff6ff', borderRadius: '10px' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📅</div>
                <div style={{ fontSize: '18px', color: '#1d4ed8' }}>No jobs scheduled</div>
              </div>
            ) : (
              Object.entries(groupJobsByDate(jrJobs)).map(([date, jobs]) => (
                <div key={date}>
                  <h3 style={{ marginTop: '15px', marginBottom: '10px', paddingBottom: '5px', borderBottom: '2px solid #2563eb', color: '#2563eb' }}>{date}</h3>
                  {jobs.map(job => (
                    <div key={job.id} onClick={() => { setSelectedJob({ ...job, calendarId: CALENDARS.JR_APPOINTMENT }); setShowDispatch(false); }} style={{ padding: '12px', marginBottom: '8px', backgroundColor: '#eff6ff', borderRadius: '5px', borderLeft: '4px solid #2563eb', cursor: 'pointer' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        {new Date(job.start?.dateTime || job.start?.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#111827' }}>{job.summary}</div>
                      {extractAddress(job) && <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>📍 {extractAddress(job)}</div>}
                    </div>
                  ))}
                </div>
              ))
            )}
          </>
        )}

        {/* Sara Tab */}
        {dispatchTab === 'sara' && (
          <>
            {saraJobs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fdf2f8', borderRadius: '10px' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📅</div>
                <div style={{ fontSize: '18px', color: '#be185d' }}>No tasks scheduled</div>
              </div>
            ) : (
              Object.entries(groupJobsByDate(saraJobs)).map(([date, jobs]) => (
                <div key={date}>
                  <h3 style={{ marginTop: '15px', marginBottom: '10px', paddingBottom: '5px', borderBottom: '2px solid #ec4899', color: '#ec4899' }}>{date}</h3>
                  {jobs.map(job => (
                    <div key={job.id} onClick={() => { setSelectedJob({ ...job, calendarId: CALENDARS.SARA_TASKS }); setShowDispatch(false); }} style={{ padding: '12px', marginBottom: '8px', backgroundColor: '#fdf2f8', borderRadius: '5px', borderLeft: '4px solid #ec4899', cursor: 'pointer' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        {new Date(job.start?.dateTime || job.start?.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#111827' }}>{job.summary}</div>
                      {job.description && <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', whiteSpace: 'pre-wrap' }}>📝 {job.description.substring(0, 100)}{job.description.length > 100 ? '...' : ''}</div>}
                    </div>
                  ))}
                </div>
              ))
            )}
          </>
        )}

        {/* Returns Tab */}
        {dispatchTab === 'returns' && (
          <>
            {returnNeededJobs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#faf5ff', borderRadius: '10px' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
                <div style={{ fontSize: '18px', color: '#7c3aed' }}>No returns needed!</div>
              </div>
            ) : (
              returnNeededJobs.map(job => {
                const age = getQueueAge(job);
                const customerName = job.summary.replace('[RETURN NEEDED]', '').replace('[COMPLETE]', '').replace('[SERVICE]', '').replace('- QUEUE -', '').trim();
                return (
                  <div key={job.id} style={{ padding: '15px', marginBottom: '10px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', borderLeft: '4px solid #9333ea' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>{getCalendarName(job.calendarId)}</span>
                      <span style={{ fontSize: '12px', color: age.color, fontWeight: 'bold' }}>{age.emoji} {age.days} days</span>
                    </div>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>{customerName}</div>
                    {extractPhone(job) && <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>📞 {extractPhone(job)}</div>}
                    {extractAddress(job) && <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>📍 {extractAddress(job)}</div>}
                    {job.description && (
                      <div style={{ fontSize: '12px', color: '#374151', marginBottom: '8px', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '6px', maxHeight: '60px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                        📝 {job.description.substring(0, 150)}{job.description.length > 150 ? '...' : ''}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openAssignModal(job, 'austin')} style={{ flex: 1, padding: '8px', fontSize: '12px', backgroundColor: '#0891b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Austin</button>
                      <button onClick={() => openAssignModal(job, 'jr')} style={{ flex: 1, padding: '8px', fontSize: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>JR</button>
                      <button onClick={() => openAssignModal(job, 'sara')} style={{ flex: 1, padding: '8px', fontSize: '12px', backgroundColor: '#ec4899', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Sara</button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        <QuickLinksBar />
      </div>
    );
  }

  // New Service Call Form
  if (showNewServiceCall) {
    return (
      <div style={{ 
        padding: '20px',
        paddingBottom: '80px',
        maxWidth: '400px',
        margin: '0 auto',
        fontFamily: 'Arial'
      }}>
        <button 
          onClick={() => setShowNewServiceCall(false)}
          style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← Cancel
        </button>

        <h2>📋 New Service Call</h2>
        
        {/* Customer Name - Required with Autocomplete */}
        <div style={{ marginBottom: '15px', position: 'relative' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            👤 Customer Name <span style={{color: '#ef4444'}}>*</span>
          </label>
          <input 
            type="text"
            value={newServiceData.customerName}
            onChange={(e) => {
              setNewServiceData({...newServiceData, customerName: e.target.value});
              filterCustomerSuggestions(e.target.value);
            }}
            onFocus={() => {
              if (newServiceData.customerName.length >= 2) {
                filterCustomerSuggestions(newServiceData.customerName);
              }
            }}
            onBlur={() => {
              // Delay hiding to allow click on suggestion
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder="Start typing to search customers..."
            autoComplete="off"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              borderRadius: '8px',
              border: '1px solid #ccc'
            }}
          />
          
          {/* Autocomplete Suggestions */}
          {showSuggestions && customerSuggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              maxHeight: '250px',
              overflowY: 'auto'
            }}>
              {customerSuggestions.map((customer, idx) => (
                <div 
                  key={idx}
                  onClick={() => selectCustomerSuggestion(customer)}
                  style={{
                    padding: '12px 15px',
                    cursor: 'pointer',
                    borderBottom: idx < customerSuggestions.length - 1 ? '1px solid #eee' : 'none',
                    backgroundColor: '#fff'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                >
                  <div style={{ fontWeight: 'bold', color: '#111', marginBottom: '2px' }}>{customer.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {customer.phone && <span>📞 {customer.phone}</span>}
                    {customer.phone && customer.address && <span> • </span>}
                    {customer.address && <span>📍 {customer.address.substring(0, 30)}{customer.address.length > 30 ? '...' : ''}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {customerDatabase.length > 0 && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              💡 {customerDatabase.length} customers loaded - type to search
            </div>
          )}
        </div>

        {/* Phone */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            📞 Phone
          </label>
          <input 
            type="tel"
            value={newServiceData.phone}
            onChange={(e) => setNewServiceData({...newServiceData, phone: e.target.value})}
            placeholder="(555) 555-5555"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              borderRadius: '8px',
              border: '1px solid #ccc'
            }}
          />
        </div>

        {/* Address */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            📍 Address
          </label>
          <input 
            type="text"
            value={newServiceData.address}
            onChange={(e) => setNewServiceData({...newServiceData, address: e.target.value})}
            placeholder="Full address"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              borderRadius: '8px',
              border: '1px solid #ccc'
            }}
          />
        </div>

        {/* Source & Priority - Side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              📥 Source
            </label>
            <select
              value={newServiceData.source}
              onChange={(e) => setNewServiceData({...newServiceData, source: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1px solid #ccc'
              }}
            >
              <option value="phone">📞 Phone</option>
              <option value="email">📧 Email</option>
              <option value="monitoring">📡 Monitoring</option>
              <option value="walkin">🚶 Walk-in</option>
              <option value="referral">👥 Referral</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              ⚡ Priority
            </label>
            <select
              value={newServiceData.priority}
              onChange={(e) => setNewServiceData({...newServiceData, priority: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1px solid #ccc'
              }}
            >
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="normal">⚪ Normal</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
        </div>

        {/* Issue/Notes */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            🔧 Issue / Notes
          </label>
          <textarea 
            value={newServiceData.issue}
            onChange={(e) => setNewServiceData({...newServiceData, issue: e.target.value})}
            rows="4"
            placeholder="Describe the issue, what they need, any special instructions..."
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              fontFamily: 'Arial'
            }}
          />
        </div>

        <button 
          onClick={submitNewServiceCall}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '18px',
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ✅ Create Service Call
        </button>

        <QuickLinksBar />
      </div>
    );
  }

  // CMS Signals View
  if (showSignals) {
    return (
      <div style={{ padding: "20px", paddingBottom: "80px", maxWidth: "400px", margin: "0 auto", fontFamily: "Arial" }}>
        <button onClick={() => { setShowSignals(false); setShowAddSignal(false); }} style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#666", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>← Back</button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>📡 CMS Signals</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={fetchCmsSignals}
              style={{ padding: '8px 12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🔄 Refresh
            </button>
            <button 
              onClick={() => setShowAddSignal(!showAddSignal)}
              style={{ padding: '8px 12px', backgroundColor: '#C41E1E', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {showAddSignal ? '✕' : '+'}
            </button>
          </div>
        </div>
        
        {/* Add Signal Form */}
        {showAddSignal && (
          <div style={{ backgroundColor: '#fef2f2', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: '2px solid #C41E1E' }}>
            <div style={{ marginBottom: '10px' }}>
              <input 
                type="text" 
                placeholder="Customer Name *" 
                value={newSignal.customer}
                onChange={(e) => setNewSignal({...newSignal, customer: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '8px' }}
              />
              <input 
                type="text" 
                placeholder="CS# (e.g., FLRS63107)" 
                value={newSignal.csNumber}
                onChange={(e) => setNewSignal({...newSignal, csNumber: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '8px' }}
              />
              <select 
                value={newSignal.signalType}
                onChange={(e) => setNewSignal({...newSignal, signalType: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '8px' }}
              >
                <option value="Trbl Signal">⚠️ Trouble Signal</option>
                <option value="Suprv Signal">🔔 Supervisory Signal</option>
                <option value="Alarm">🚨 Alarm</option>
                <option value="Low Battery">🔋 Low Battery</option>
                <option value="Comm Fail">📡 Comm Failure</option>
              </select>
              <input 
                type="text" 
                placeholder="Zone (e.g., Zone# 4 - VALVE TAMPER)" 
                value={newSignal.zone}
                onChange={(e) => setNewSignal({...newSignal, zone: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '8px' }}
              />
              <input 
                type="text" 
                placeholder="Address" 
                value={newSignal.address}
                onChange={(e) => setNewSignal({...newSignal, address: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '8px' }}
              />
              <input 
                type="tel" 
                placeholder="Phone" 
                value={newSignal.phone}
                onChange={(e) => setNewSignal({...newSignal, phone: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>
            <button 
              onClick={() => {
                if (!newSignal.customer) { alert('Customer name required'); return; }
                const signal = {
                  ...newSignal,
                  id: Date.now(),
                  timestamp: new Date().toISOString(),
                  status: 'new'
                };
                setCmsSignals(prev => [signal, ...prev]);
                setNewSignal({ customer: '', zone: '', signalType: 'Trbl Signal', address: '', phone: '', csNumber: '' });
                setShowAddSignal(false);
              }}
              style={{ width: '100%', padding: '12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ✅ Add Signal
            </button>
          </div>
        )}

        <p style={{ color: "#666", marginBottom: "15px" }}>{cmsSignals.length} active signal{cmsSignals.length !== 1 ? 's' : ''}</p>
        
        {cmsSignals.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", backgroundColor: "#f0fdf4", borderRadius: "10px" }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>✅</div>
            <div style={{ fontSize: "18px", color: "#16a34a" }}>No active signals</div>
            <div style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>Signals from CMS monitoring will appear here</div>
          </div>
        ) : (
          cmsSignals.map(s => enrichSignalWithCustomer(s)).map(signal => (
            <div key={signal.id} style={{ 
              padding: "15px", 
              marginBottom: "12px", 
              backgroundColor: signal.matchedCustomer ? "#f0fdf4" : "#fff", 
              border: signal.matchedCustomer ? "1px solid #86efac" : "1px solid #fecaca", 
              borderRadius: "10px", 
              borderLeft: `4px solid ${signal.signalType === 'Alarm' ? '#dc2626' : signal.signalType === 'Comm Fail' ? '#7c3aed' : '#f59e0b'}` 
            }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ 
                  padding: '4px 8px', 
                  backgroundColor: signal.signalType === 'Alarm' ? '#fee2e2' : '#fef3c7', 
                  color: signal.signalType === 'Alarm' ? '#dc2626' : '#d97706', 
                  borderRadius: '4px', 
                  fontSize: '11px', 
                  fontWeight: 'bold' 
                }}>
                  {signal.signalType === 'Trbl Signal' && '⚠️ TROUBLE'}
                  {signal.signalType === 'Suprv Signal' && '🔔 SUPERVISORY'}
                  {signal.signalType === 'Alarm' && '🚨 ALARM'}
                  {signal.signalType === 'Low Battery' && '🔋 LOW BATTERY'}
                  {signal.signalType === 'Comm Fail' && '📡 COMM FAIL'}
                </span>
                <span style={{ fontSize: "11px", color: "#666" }}>
                  {new Date(signal.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              {/* Customer & CS# */}
              <div style={{ fontWeight: "bold", fontSize: "16px", color: "#111" }}>
                {signal.customer}
                {signal.matchedCustomer && <span style={{ marginLeft: "8px", fontSize: "11px", backgroundColor: "#16a34a", color: "white", padding: "2px 6px", borderRadius: "4px" }}>✓ CRM Match</span>}
              </div>
              {signal.csNumber && <div style={{ fontSize: "12px", color: "#666" }}>CS# {signal.csNumber}</div>}
              
              {/* Zone */}
              {signal.zone && <div style={{ fontSize: "14px", color: "#C41E1E", marginTop: "6px" }}>{signal.zone}</div>}
              
              {/* Address & Phone */}
              {signal.address && (
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(signal.address)}`} 
                   target="_blank" rel="noopener noreferrer"
                   style={{ display: "block", fontSize: "13px", color: "#666", marginTop: "6px", textDecoration: "none" }}>
                  📍 {signal.address}
                </a>
              )}
              {signal.phone && (
                <a href={`tel:${signal.phone}`} style={{ display: "block", fontSize: "14px", color: "#2563eb", marginTop: "4px", textDecoration: "none" }}>
                  📞 {signal.phone}
                </a>
              )}
              
              {/* Actions */}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button 
                  onClick={async () => {
                    // Convert to service call
                    setNewServiceData({
                      customerName: signal.customer,
                      phone: signal.phone || '',
                      address: signal.address || '',
                      issue: `CMS Signal: ${signal.signalType}\n${signal.zone}\nCS# ${signal.csNumber || 'N/A'}`,
                      priority: signal.signalType === 'Alarm' ? 'urgent' : 'high',
                      source: 'monitoring'
                    });
                    // Mark email as read
                    if (signal.emailId) {
                      markEmailRead(signal.emailId);
                    }
                    setCmsSignals(prev => prev.filter(s => s.id !== signal.id));
                    setShowSignals(false);
                    setShowNewServiceCall(true);
                  }}
                  style={{ flex: 1, padding: "10px", backgroundColor: "#C41E1E", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                >
                  🔴 Create Service Call
                </button>
                <button 
                  onClick={async () => {
                    if (confirm('Dismiss this signal?')) {
                      // Mark email as read
                      if (signal.emailId) {
                        await markEmailRead(signal.emailId);
                      }
                      setCmsSignals(prev => prev.filter(s => s.id !== signal.id));
                    }
                  }}
                  style={{ padding: "10px 15px", backgroundColor: "#6b7280", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
        
        <QuickLinksBar />
      </div>
    );
  }

  // Sales Job Detail View
  if (selectedSalesJob) {
    const job = selectedSalesJob;
    const customerName = job.summary.replace('[ESTIMATE NEEDED]', '').replace('[ESTIMATE SENT]', '').replace('[SERVICE]', '').replace('[FOLLOW UP]', '').trim();
    const phone = extractPhone(job);
    const address = extractAddress(job);
    const hasEstimateSent = job.summary.includes('[ESTIMATE SENT]');
    const hasFollowUp = job.summary.includes('[FOLLOW UP]');

    return (
      <div style={{ padding: "20px", paddingBottom: "80px", maxWidth: "400px", margin: "0 auto", fontFamily: "Arial" }}>
        <button onClick={() => setSelectedSalesJob(null)} style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#666", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>← Back to Sales Queue</button>
        
        {/* Status badges */}
        <div style={{ marginBottom: '15px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {hasEstimateSent && (
            <span style={{ padding: '6px 12px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>✅ ESTIMATE SENT</span>
          )}
          {hasFollowUp && (
            <span style={{ padding: '6px 12px', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>📞 FOLLOW UP</span>
          )}
          {!hasEstimateSent && !hasFollowUp && (
            <span style={{ padding: '6px 12px', backgroundColor: '#fce7f3', color: '#be185d', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>🆕 NEW LEAD</span>
          )}
        </div>

        {/* Customer Name */}
        <h2 style={{ margin: '0 0 20px 0', color: '#111' }}>{customerName}</h2>
        
        {/* Contact Info */}
        {phone && (
          <a href={`tel:${phone}`} style={{
            display: 'block',
            padding: '15px',
            backgroundColor: '#eff6ff',
            borderRadius: '10px',
            marginBottom: '10px',
            textDecoration: 'none',
            color: '#2563eb',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            📞 {phone}
          </a>
        )}
        
        {address && (
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`} 
             target="_blank" rel="noopener noreferrer"
             style={{
               display: 'block',
               padding: '15px',
               backgroundColor: '#f0fdf4',
               borderRadius: '10px',
               marginBottom: '15px',
               textDecoration: 'none',
               color: '#16a34a',
               fontSize: '14px'
             }}>
            📍 {address}
          </a>
        )}
        
        {/* Full Notes */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>📝 Full Notes:</div>
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '15px',
            borderRadius: '10px',
            fontSize: '14px',
            whiteSpace: 'pre-wrap',
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid #e5e7eb'
          }}>
            {job.description || 'No notes yet'}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={async () => {
            const newSummary = `[INSTALLATION] ${customerName}`;
            const soldNotes = `\n\n━━━ SOLD ━━━\n📅 ${new Date().toLocaleDateString()}\n👤 ${userEmail}\n`;
            try {
              await moveEventToCalendar(job, CALENDARS.SERVICE_QUEUE, newSummary, (job.description || '') + soldNotes);
              setSalesQueueJobs(prev => prev.filter(j => j.id !== job.id));
              setSelectedSalesJob(null);
              alert('🎉 SOLD! Moved to installation queue');
            } catch(e) { alert('Error'); }
          }} style={{ 
            padding: "15px", 
            fontSize: "16px", 
            backgroundColor: "#16a34a", 
            color: "white", 
            border: "none", 
            borderRadius: "10px", 
            cursor: "pointer", 
            fontWeight: "bold" 
          }}>🎉 SOLD - Move to Installation</button>
          
          {!hasEstimateSent && (
            <button onClick={async () => {
              const newSummary = `[ESTIMATE SENT] ${customerName}`;
              const sentNotes = `\n\n━━━ ESTIMATE SENT ━━━\n📅 ${new Date().toLocaleDateString()}\n👤 ${userEmail}\n`;
              try {
                await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(job.calendarId)}/events/${job.id}`, {
                  method: 'PATCH',
                  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ summary: newSummary, description: (job.description || '') + sentNotes })
                });
                await fetchSalesQueue();
                setSelectedSalesJob(null);
                alert('✅ Marked as Estimate Sent');
              } catch(e) { alert('Error'); }
            }} style={{ 
              padding: "15px", 
              fontSize: "16px", 
              backgroundColor: "#2563eb", 
              color: "white", 
              border: "none", 
              borderRadius: "10px", 
              cursor: "pointer", 
              fontWeight: "bold" 
            }}>📨 Mark Estimate Sent</button>
          )}
          
          {hasEstimateSent && !hasFollowUp && (
            <button onClick={async () => {
              const newSummary = `[FOLLOW UP] [ESTIMATE SENT] ${customerName}`;
              const followNotes = `\n\n━━━ FOLLOW UP NEEDED ━━━\n📅 ${new Date().toLocaleDateString()}\n👤 ${userEmail}\n`;
              try {
                await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(job.calendarId)}/events/${job.id}`, {
                  method: 'PATCH',
                  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ summary: newSummary, description: (job.description || '') + followNotes })
                });
                await fetchSalesQueue();
                setSelectedSalesJob(null);
                alert('📞 Follow up scheduled');
              } catch(e) { alert('Error'); }
            }} style={{ 
              padding: "15px", 
              fontSize: "16px", 
              backgroundColor: "#f59e0b", 
              color: "white", 
              border: "none", 
              borderRadius: "10px", 
              cursor: "pointer", 
              fontWeight: "bold" 
            }}>📞 Mark for Follow Up</button>
          )}
          
          <button onClick={async () => {
            if (!confirm('Mark as lost?')) return;
            const newSummary = `[LOST] ${customerName}`;
            const lostNotes = `\n\n━━━ LOST ━━━\n📅 ${new Date().toLocaleDateString()}\n👤 ${userEmail}\n`;
            try {
              await moveEventToCalendar(job, CALENDARS.COMPLETED, newSummary, (job.description || '') + lostNotes);
              setSalesQueueJobs(prev => prev.filter(j => j.id !== job.id));
              setSelectedSalesJob(null);
              alert('Marked as Lost');
            } catch(e) { alert('Error'); }
          }} style={{ 
            padding: "15px", 
            fontSize: "16px", 
            backgroundColor: "#6b7280", 
            color: "white", 
            border: "none", 
            borderRadius: "10px", 
            cursor: "pointer", 
            fontWeight: "bold" 
          }}>❌ Mark as Lost</button>
        </div>
        
        <QuickLinksBar />
      </div>
    );
  }

  // Sales Queue View - JR's Estimate Queue
  if (showSalesQueue) {
    return (
      <div style={{ padding: "20px", paddingBottom: "80px", maxWidth: "400px", margin: "0 auto", fontFamily: "Arial" }}>
        <button onClick={() => setShowSalesQueue(false)} style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#666", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>← Back</button>
        <h2>💰 Sales Queue</h2>
        <p style={{ color: "#666", marginBottom: "15px" }}>{salesQueueJobs.length} estimate{salesQueueJobs.length !== 1 ? "s" : ""} pending</p>
        
        {salesQueueJobs.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", backgroundColor: "#fdf2f8", borderRadius: "10px" }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>✅</div>
            <div style={{ fontSize: "18px", color: "#be185d" }}>All caught up!</div>
          </div>
        ) : (
          salesQueueJobs.map(job => {
            const age = getQueueAge(job);
            const customerName = job.summary.replace('[ESTIMATE NEEDED]', '').replace('[ESTIMATE SENT]', '').replace('[SERVICE]', '').replace('[FOLLOW UP]', '').trim();
            const hasEstimateSent = job.summary.includes('[ESTIMATE SENT]');
            const hasFollowUp = job.summary.includes('[FOLLOW UP]');
            const phone = extractPhone(job);
            const address = extractAddress(job);
            
            return (
              <div key={job.id} style={{ 
                padding: "15px", 
                marginBottom: "12px", 
                backgroundColor: "#fff", 
                border: "1px solid #e5e7eb", 
                borderRadius: "10px", 
                borderLeft: `4px solid ${hasEstimateSent ? '#16a34a' : hasFollowUp ? '#f59e0b' : '#ec4899'}` 
              }}>
                {/* Header with age */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    {hasEstimateSent && "✅ ESTIMATE SENT • "}
                    {hasFollowUp && "📞 FOLLOW UP • "}
                    {new Date(job.start?.dateTime || job.created).toLocaleDateString()}
                  </span>
                  <span style={{ fontSize: "12px", color: age.color, fontWeight: "bold" }}>{age.emoji} {age.days}d</span>
                </div>
                
                {/* Customer name */}
                <div style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "10px", color: "#111827" }}>{customerName}</div>
                
                {/* Contact info */}
                {phone && (
                  <a href={`tel:${phone}`} style={{ 
                    display: "block", 
                    fontSize: "15px", 
                    color: "#2563eb", 
                    marginBottom: "6px",
                    textDecoration: "none"
                  }}>📞 {phone}</a>
                )}
                {address && (
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`} 
                     target="_blank" rel="noopener noreferrer"
                     style={{ display: "block", fontSize: "14px", color: "#666", marginBottom: "10px", textDecoration: "none" }}>
                    📍 {address}
                  </a>
                )}
                
                {/* Notes preview */}
                <div style={{ 
                  fontSize: "13px", 
                  color: "#666", 
                  marginBottom: "12px", 
                  whiteSpace: "pre-wrap",
                  backgroundColor: "#f9fafb",
                  padding: "10px",
                  borderRadius: "6px",
                  maxHeight: "100px",
                  overflowY: "auto"
                }}>
                  {job.description?.substring(0, 300) || "No notes"}
                </div>
                
                {/* OPEN BUTTON - Full width */}
                <button 
                  onClick={() => setSelectedSalesJob(job)}
                  style={{ 
                    width: "100%",
                    padding: "12px", 
                    fontSize: "14px", 
                    backgroundColor: "#0A2240", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "8px", 
                    cursor: "pointer", 
                    fontWeight: "bold",
                    marginBottom: "10px"
                  }}>📂 OPEN - View Full Details</button>
                
                {/* Action buttons - 2x2 grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {/* SOLD - moves to installation queue */}
                  <button onClick={async () => {
                    const newSummary = `[INSTALLATION] ${customerName}`;
                    const soldNotes = `\n\n━━━ SOLD ━━━\n📅 ${new Date().toLocaleDateString()}\n👤 ${userEmail}\n`;
                    try {
                      await moveEventToCalendar(job, CALENDARS.SERVICE_QUEUE, newSummary, (job.description || '') + soldNotes);
                      setSalesQueueJobs(prev => prev.filter(j => j.id !== job.id));
                      alert('🎉 SOLD! Moved to installation queue');
                    } catch(e) { alert('Error'); }
                  }} style={{ 
                    padding: "12px", 
                    fontSize: "14px", 
                    backgroundColor: "#16a34a", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "8px", 
                    cursor: "pointer", 
                    fontWeight: "bold" 
                  }}>🎉 SOLD</button>
                  
                  {/* ESTIMATE SENT */}
                  {!hasEstimateSent && (
                    <button onClick={async () => {
                      const newSummary = `[ESTIMATE SENT] ${customerName}`;
                      const sentNotes = `\n\n━━━ ESTIMATE SENT ━━━\n📅 ${new Date().toLocaleDateString()}\n👤 ${userEmail}\n`;
                      try {
                        await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(job.calendarId)}/events/${job.id}`, {
                          method: 'PATCH',
                          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                          body: JSON.stringify({ summary: newSummary, description: (job.description || '') + sentNotes })
                        });
                        await fetchSalesQueue();
                        alert('✅ Marked as Estimate Sent');
                      } catch(e) { alert('Error'); }
                    }} style={{ 
                      padding: "12px", 
                      fontSize: "14px", 
                      backgroundColor: "#2563eb", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "8px", 
                      cursor: "pointer", 
                      fontWeight: "bold" 
                    }}>📨 SENT</button>
                  )}
                  
                  {/* FOLLOW UP */}
                  {hasEstimateSent && !hasFollowUp && (
                    <button onClick={async () => {
                      const newSummary = `[FOLLOW UP] [ESTIMATE SENT] ${customerName}`;
                      const followNotes = `\n\n━━━ FOLLOW UP NEEDED ━━━\n📅 ${new Date().toLocaleDateString()}\n👤 ${userEmail}\n`;
                      try {
                        await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(job.calendarId)}/events/${job.id}`, {
                          method: 'PATCH',
                          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                          body: JSON.stringify({ summary: newSummary, description: (job.description || '') + followNotes })
                        });
                        await fetchSalesQueue();
                        alert('📞 Follow up scheduled');
                      } catch(e) { alert('Error'); }
                    }} style={{ 
                      padding: "12px", 
                      fontSize: "14px", 
                      backgroundColor: "#f59e0b", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "8px", 
                      cursor: "pointer", 
                      fontWeight: "bold" 
                    }}>📞 FOLLOW UP</button>
                  )}
                  
                  {/* LOST */}
                  <button onClick={async () => {
                    if (!confirm('Mark as lost?')) return;
                    const newSummary = `[LOST] ${customerName}`;
                    const lostNotes = `\n\n━━━ LOST ━━━\n📅 ${new Date().toLocaleDateString()}\n👤 ${userEmail}\n`;
                    try {
                      await moveEventToCalendar(job, CALENDARS.COMPLETED, newSummary, (job.description || '') + lostNotes);
                      setSalesQueueJobs(prev => prev.filter(j => j.id !== job.id));
                      alert('Marked as Lost');
                    } catch(e) { alert('Error'); }
                  }} style={{ 
                    padding: "12px", 
                    fontSize: "14px", 
                    backgroundColor: "#6b7280", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "8px", 
                    cursor: "pointer", 
                    fontWeight: "bold" 
                  }}>❌ LOST</button>
                </div>
              </div>
            );
          })
        )}
        <QuickLinksBar />
      </div>
    );
  }

  if (showToBeBilled) {
    // Billing Action Modal
    if (showBillingAction && billingActionJob) {
      const job = billingActionJob;
      return (
        <div style={{ padding: "20px", paddingBottom: "80px", maxWidth: "400px", margin: "0 auto", fontFamily: "Arial" }}>
          <button onClick={() => { setShowBillingAction(false); setBillingActionJob(null); }} style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#666", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>← Back to List</button>
          
          <h2>📋 {job.summary.replace("[COMPLETE]", "").trim()}</h2>
          <p style={{ color: "#666", fontSize: "14px" }}>{new Date(job.start?.dateTime || job.start?.date).toLocaleDateString()}</p>
          
          {/* Existing Notes */}
          <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px", marginBottom: "15px", fontSize: "13px", whiteSpace: "pre-wrap", maxHeight: "150px", overflowY: "auto" }}>
            <strong>Existing Notes:</strong><br/>
            {job.description || "No notes yet"}
          </div>
          
          {/* Add Notes */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>📝 Add Notes:</label>
            <textarea 
              value={billingActionNotes} 
              onChange={(e) => setBillingActionNotes(e.target.value)}
              placeholder="Add notes before taking action..."
              rows="3"
              style={{ width: "100%", padding: "10px", fontSize: "14px", borderRadius: "5px", border: "1px solid #ccc", fontFamily: "Arial" }}
            />
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={() => markAsBilled(job, billingActionNotes)} style={{ width: "100%", padding: "12px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}>💵 Mark Billed</button>
            
            <button onClick={() => requestNotesFromTech(job)} style={{ width: "100%", padding: "12px", backgroundColor: "#f59e0b", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}>📝 Request Notes from JR</button>
            
            <button onClick={() => pushToServiceQueue(job, billingActionNotes)} style={{ width: "100%", padding: "12px", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}>🔄 Back to Service Queue</button>
            
            <button onClick={() => pushToSalesQueue(job, billingActionNotes)} style={{ width: "100%", padding: "12px", backgroundColor: "#ec4899", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}>💰 Move to Sales Queue</button>
            
            <button onClick={() => markAsNoCharge(job, billingActionNotes)} style={{ width: "100%", padding: "12px", backgroundColor: "#6b7280", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}>🚫 No Charge</button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: "20px", paddingBottom: "80px", maxWidth: "400px", margin: "0 auto", fontFamily: "Arial" }}>
        <button onClick={() => setShowToBeBilled(false)} style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#666", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>← Back</button>
        <h2>💰 To Be Billed</h2>
        <p style={{ color: "#666", marginBottom: "15px" }}>{toBeBilledJobs.length} completed job{toBeBilledJobs.length !== 1 ? "s" : ""} (last {billingDaysBack} days)</p>
        <button onClick={() => fetchToBeBilled(billingDaysBack + 30)} style={{ width: "100%", padding: "10px", marginBottom: "20px", backgroundColor: "#e5e7eb", border: "none", borderRadius: "5px", cursor: "pointer" }}>Load More (+30 days)</button>
        {toBeBilledJobs.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", backgroundColor: "#f0fdf4", borderRadius: "10px" }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>✅</div>
            <div style={{ fontSize: "18px", color: "#065f46" }}>All caught up!</div>
          </div>
        ) : (
          toBeBilledJobs.map(job => {
            const daysOld = Math.floor((new Date() - new Date(job.start?.dateTime || job.start?.date)) / (1000*60*60*24));
            const isOverdue = daysOld > 7;
            return (
            <div 
              key={job.id} 
              onClick={() => openBillingAction(job)}
              style={{ padding: "15px", marginBottom: "10px", backgroundColor: isOverdue ? "#fef2f2" : "#fff", border: isOverdue ? "2px solid #dc2626" : "1px solid #e5e7eb", borderRadius: "8px", borderLeft: "4px solid " + getCalendarColor(job.calendarId), cursor: "pointer" }}
            >
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px", display: "flex", justifyContent: "space-between" }}>
                <span>{getCalendarName(job.calendarId)}</span>
                <span style={{ color: isOverdue ? "#dc2626" : "#666", fontWeight: isOverdue ? "bold" : "normal" }}>{daysOld} days ago</span>
              </div>
              <div style={{ fontWeight: "bold", marginBottom: "5px", color: "#111827" }}>{job.summary.replace("[COMPLETE]", "").trim()}</div>
              <div style={{ fontSize: "12px", color: "#666" }}>{new Date(job.start?.dateTime || job.start?.date).toLocaleDateString()}</div>
              
              {/* Notes Preview */}
              {job.description && (
                <div style={{ 
                  fontSize: "12px", 
                  color: "#374151", 
                  marginTop: "8px", 
                  padding: "8px", 
                  backgroundColor: "#f3f4f6", 
                  borderRadius: "6px",
                  maxHeight: "60px",
                  overflowY: "auto",
                  whiteSpace: "pre-wrap"
                }}>
                  📝 {job.description.substring(0, 200)}{job.description.length > 200 ? '...' : ''}
                </div>
              )}
              
              <div style={{ fontSize: "11px", color: "#2563eb", marginTop: "8px" }}>Tap to take action →</div>
            </div>
            );
          })
        )}
      </div>
    );
  }

  if (showPastJobs) {
    return (
      <div style={{ padding: "20px", paddingBottom: "80px", maxWidth: "400px", margin: "0 auto", fontFamily: "Arial" }}>
        <button onClick={() => setShowPastJobs(false)} style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#666", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>← Back</button>
        <h2>🕐 Past Jobs</h2>
        <p style={{ color: "#666", marginBottom: "15px" }}>Select a date to view jobs:</p>
        <input type="date" value={pastJobsDate} onChange={(e) => setPastJobsDate(e.target.value)} style={{ width: "100%", padding: "15px", fontSize: "18px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #ccc" }} />
        <button onClick={async () => { if (!pastJobsDate) return; const d = new Date(pastJobsDate + "T00:00:00"); const start = new Date(d); start.setHours(0,0,0,0); const end = new Date(d); end.setHours(23,59,59,999); let cals = []; try { const r = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", { headers: { Authorization: "Bearer " + accessToken }}); const data = await r.json(); if (data.items) cals = data.items.filter(c => c.id !== userEmail).map(c => c.id); } catch(e) {} let events = []; for (const cal of cals) { try { const r = await fetch("https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(cal) + "/events?timeMin=" + start.toISOString() + "\&timeMax=" + end.toISOString() + "\&orderBy=startTime\&singleEvents=true", { headers: { Authorization: "Bearer " + accessToken }}); if (r.ok) { const data = await r.json(); if (data.items) events = [...events, ...data.items.map(e => ({...e, calendarId: cal}))]; }} catch(e) {}} events.sort((a,b) => new Date(a.start.dateTime || a.start.date) - new Date(b.start.dateTime || b.start.date)); setTodaysJobs(events); setShowPastJobs(false); setShowJobs(true); setDayView("custom"); }} style={{ width: "100%", padding: "15px", fontSize: "18px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Load Jobs</button>
      </div>
    );
  }

if (showTasks) {
    return (
      <div style={{ 
        padding: '20px',
        paddingBottom: '80px',
        maxWidth: '400px',
        margin: '0 auto',
        fontFamily: 'Arial'
      }}>
        <button 
          onClick={() => setShowTasks(false)}
          style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>

        <h2>📋 Today's Tasks</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you
        </p>

        {tasks.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#f0fdf4',
            borderRadius: '10px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎉</div>
            <div style={{ fontSize: '18px', color: '#065f46' }}>All caught up!</div>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.rowIndex}
              style={{
                padding: '15px',
                marginBottom: '10px',
                backgroundColor: '#fff',
                border: `2px solid ${task.priority === 'HIGH' ? '#dc2626' : '#f59e0b'}`,
                borderRadius: '8px'
              }}
            >
              <div style={{
                fontSize: '12px',
                color: task.priority === 'HIGH' ? '#dc2626' : '#f59e0b',
                fontWeight: 'bold',
                marginBottom: '5px'
              }}>
                {task.priority === 'HIGH' ? '🔴 HIGH PRIORITY' : '🟡 MEDIUM'}
              </div>
              <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                {task.text}
              </div>
              <button
                onClick={() => completeTask(task)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✅ Mark Complete
              </button>
            </div>
          ))
        )}

        <QuickLinksBar />
      </div>
    );
  }
  if (showActions) {
    const remaining = weeklyActions.length - completedActions.length;
    
    return (
      <div style={{ 
        padding: '20px',
        paddingBottom: '80px',
        maxWidth: '400px',
        margin: '0 auto',
        fontFamily: 'Arial'
      }}>
        <button 
          onClick={() => setShowActions(false)}
          style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>

        <div style={{
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#92400e' }}>⚠️ THIS WEEK'S PRIORITY</h2>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#92400e' }}>
            Fix {remaining} calendar {remaining === 1 ? 'item' : 'items'} = Prevent $10K loss
          </p>
        </div>

        <h3 style={{ marginBottom: '15px' }}>Actions Needed:</h3>

        {weeklyActions.map((action) => {
          const isComplete = completedActions.includes(action.id);
          return (
            <div
              key={action.id}
              onClick={() => toggleAction(action.id)}
              style={{
                padding: '15px',
                marginBottom: '10px',
                backgroundColor: isComplete ? '#f0fdf4' : '#fff',
                border: `2px solid ${action.priority === 'high' ? '#dc2626' : '#f59e0b'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                opacity: isComplete ? 0.6 : 1
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '2px solid #666',
                backgroundColor: isComplete ? '#16a34a' : 'white',
                marginRight: '15px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                {isComplete && '✓'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '12px',
                  color: action.priority === 'high' ? '#dc2626' : '#f59e0b',
                  fontWeight: 'bold',
                  marginBottom: '5px',
                  textTransform: 'uppercase'
                }}>
                  {action.priority === 'high' ? '🔴 HIGH PRIORITY' : '🟡 MEDIUM'}
                </div>
                <div style={{
                  fontSize: '16px',
                  textDecoration: isComplete ? 'line-through' : 'none'
                }}>
                  {action.text}
                </div>
              </div>
            </div>
          );
        })}

        {completedActions.length === weeklyActions.length && (
          <div style={{
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#d1fae5',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎉</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#065f46' }}>
              All Actions Complete!
            </div>
            <div style={{ fontSize: '16px', color: '#065f46', marginTop: '10px' }}>
              Calendar is fixed. Ready for a $15-20K week!
            </div>
          </div>
        )}

        <QuickLinksBar />
      </div>
    );
  }

  if (showReturnVisit && returnVisitJob) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    return (
      <div style={{ 
        padding: '20px',
        paddingBottom: '80px',
        maxWidth: '400px',
        margin: '0 auto',
        fontFamily: 'Arial'
      }}>
        <button 
          onClick={() => {
            setShowReturnVisit(false);
            setReturnVisitJob(null);
          }}
          style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← Cancel
        </button>

        <h2>Schedule Return Visit</h2>
        
        <div style={{
          padding: '15px',
          backgroundColor: '#f0f0f0',
          borderRadius: '5px',
          marginBottom: '20px',
          borderLeft: `4px solid ${getCalendarColor(returnVisitJob.calendarId)}`
        }}>
          <div style={{ fontWeight: 'bold' }}>{returnVisitJob.summary}</div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            Original: {new Date(returnVisitJob.start.dateTime || returnVisitJob.start.date).toLocaleDateString()}
          </div>
        </div>

        <form onSubmit={submitReturnVisit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Return Date:
            </label>
            <input 
              type="date" 
              name="returnDate"
              min={minDate}
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Return Time:
            </label>
            <input 
              type="time" 
              name="returnTime"
              defaultValue="09:00"
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Reason for Return:
            </label>
            <textarea 
              name="notes"
              rows="4"
              placeholder="What needs to be done?"
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                fontFamily: 'Arial'
              }}
            />
          </div>

          <button 
            type="submit"
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '18px',
              backgroundColor: '#9333ea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Schedule Return Visit
          </button>
        </form>

        <QuickLinksBar />
      </div>
    );
}


  // Job Completion Form Modal
  if (showCompletionForm && completionJob) {
    const getModeTitle = () => {
      switch(completionMode) {
        case 'return': return '🔄 Return Visit Needed';
        case 'sales': return '💰 Sales Opportunity';
        case 'complete': return '✅ Service Complete';
        case 'nocharge': return '🚫 No Charge';
        default: return 'Complete Job';
      }
    };
    
    const getModeColor = () => {
      switch(completionMode) {
        case 'return': return '#ef4444';
        case 'sales': return '#f59e0b';
        case 'complete': return '#16a34a';
        case 'nocharge': return '#6b7280';
        default: return '#16a34a';
      }
    };

    return (
      <div style={{ 
        padding: '20px',
        paddingBottom: '80px',
        maxWidth: '400px',
        margin: '0 auto',
        fontFamily: 'Arial'
      }}>
        <button 
          onClick={() => {
            setShowCompletionForm(false);
            setCompletionJob(null);
          }}
          style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← Cancel
        </button>

        <h2 style={{ color: getModeColor() }}>{getModeTitle()}</h2>
        
        <div style={{
          padding: '15px',
          backgroundColor: '#f0f0f0',
          borderRadius: '5px',
          marginBottom: '20px',
          borderLeft: `4px solid ${getModeColor()}`
        }}>
          <div style={{ fontWeight: 'bold' }}>{completionJob.summary}</div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            ⏰ Time In:
          </label>
          <input 
            type="time" 
            value={completionData.timeIn}
            onChange={(e) => setCompletionData({...completionData, timeIn: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '5px',
              border: '1px solid #ccc'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            ⏰ Time Out:
          </label>
          <input 
            type="time" 
            value={completionData.timeOut}
            onChange={(e) => setCompletionData({...completionData, timeOut: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '5px',
              border: '1px solid #ccc'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            📦 Materials Used:
          </label>
          <textarea 
            value={completionData.materials}
            onChange={(e) => setCompletionData({...completionData, materials: e.target.value})}
            rows="3"
            placeholder="List parts, equipment, supplies used..."
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              fontFamily: 'Arial'
            }}
          />
        </div>

        {completionMode === 'return' ? (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              🔄 Reason for Return: <span style={{color: '#ef4444'}}>*</span>
            </label>
            <textarea 
              value={completionData.returnReason}
              onChange={(e) => setCompletionData({...completionData, returnReason: e.target.value})}
              rows="3"
              placeholder="Why is a return visit needed? What parts/work is required?"
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                fontFamily: 'Arial'
              }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              {completionMode === 'sales' ? '💰 Sales Notes:' : '💰 Billing Notes:'}
            </label>
            <textarea 
              value={completionData.billingNotes}
              onChange={(e) => setCompletionData({...completionData, billingNotes: e.target.value})}
              rows="3"
              placeholder={completionMode === 'sales' ? 'What does the customer need? Equipment, upgrades, etc.' : 'What to bill, special charges, issues...'}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                fontFamily: 'Arial'
              }}
            />
          </div>
        )}

        <button 
          onClick={submitDisposition}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '18px',
            backgroundColor: getModeColor(),
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {completionMode === 'return' && '🔄 Submit Return'}
          {completionMode === 'sales' && '💰 Submit Sales Opportunity'}
          {completionMode === 'complete' && '✅ Submit - Ready for Billing'}
          {completionMode === 'nocharge' && '🚫 Submit No Charge'}
        </button>

        <QuickLinksBar />
      </div>
    );
  }

  // DISPOSITION MODAL - The 4-button choice screen
  if (showDispositionModal && dispositionJob) {
    return (
      <div style={{ 
        padding: '20px',
        paddingBottom: '80px',
        maxWidth: '400px',
        margin: '0 auto',
        fontFamily: 'Arial'
      }}>
        <button 
          onClick={() => {
            setShowDispositionModal(false);
            setDispositionJob(null);
          }}
          style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>

        <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Job Status</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>What happened with this job?</p>
        
        <div style={{
          padding: '15px',
          backgroundColor: '#f0f0f0',
          borderRadius: '5px',
          marginBottom: '25px',
          borderLeft: `4px solid ${getCalendarColor(dispositionJob.calendarId)}`
        }}>
          <div style={{ fontWeight: 'bold' }}>{dispositionJob.summary}</div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            {new Date(dispositionJob.start?.dateTime || dispositionJob.start?.date).toLocaleDateString()}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* RETURN NEEDED */}
          <button 
            onClick={() => openCompletionForm(dispositionJob, 'return')}
            style={{
              width: '100%',
              padding: '20px',
              fontSize: '16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '5px' }}>🔄 RETURN NEEDED</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Need to come back - parts, follow-up, etc.</div>
          </button>

          {/* SALES OPPORTUNITY */}
          <button 
            onClick={() => openCompletionForm(dispositionJob, 'sales')}
            style={{
              width: '100%',
              padding: '20px',
              fontSize: '16px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '5px' }}>💰 SALES OPPORTUNITY</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Customer wants estimate/upgrade</div>
          </button>

          {/* SERVICE COMPLETE */}
          <button 
            onClick={() => openCompletionForm(dispositionJob, 'complete')}
            style={{
              width: '100%',
              padding: '20px',
              fontSize: '16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '5px' }}>✅ SERVICE COMPLETE</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Work done - ready to bill</div>
          </button>

          {/* NO CHARGE */}
          <button 
            onClick={() => openCompletionForm(dispositionJob, 'nocharge')}
            style={{
              width: '100%',
              padding: '20px',
              fontSize: '16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '5px' }}>🚫 NO CHARGE</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Warranty, goodwill, or no work done</div>
          </button>
        </div>

        <QuickLinksBar />
      </div>
    );
  }
  if (selectedJob) {
    const phone = extractPhone(selectedJob);
    const address = extractAddress(selectedJob);
    const isComplete = selectedJob.summary.includes('[COMPLETE]');

    return (
      <div style={{ 
        padding: '20px',
        paddingBottom: '80px',
        maxWidth: '400px',
        margin: '0 auto',
        fontFamily: 'Arial'
      }}>
        <button 
          onClick={() => setSelectedJob(null)}
          style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← Back to Jobs
        </button>
        
        <div style={{
          padding: '20px',
          backgroundColor: '#f9f9f9',
          borderRadius: '10px',
          borderLeft: `6px solid ${getCalendarColor(selectedJob.calendarId)}`
        }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#666', 
            marginBottom: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}>
            {getCalendarName(selectedJob.calendarId)}
            {isComplete && <span style={{ marginLeft: '10px', color: '#16a34a' }}>✅ COMPLETE</span>}
          </div>
          
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#111827' }}>{selectedJob.summary}</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Time:</div>
            <div style={{ fontSize: '16px' }}>
              {new Date(selectedJob.start.dateTime || selectedJob.start.date).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </div>
          </div>

          {phone && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Phone:</div>
              <a 
                href={`tel:${phone}`}
                style={{
                  fontSize: '18px',
                  color: '#2563eb',
                  textDecoration: 'none',
                  display: 'block',
                  padding: '10px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '5px',
                  textAlign: 'center'
                }}
              >
                📞 {phone}
              </a>
            </div>
          )}

          {address && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Address:</div>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '16px',
                  color: '#2563eb',
                  textDecoration: 'none',
                  display: 'block',
                  padding: '10px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '5px',
                  textAlign: 'center'
                }}
              >
                🗺️ {address}<br/>
                <span style={{ fontSize: '14px' }}>Tap for directions</span>
              </a>
            </div>
          )}
          
          {/* Notes Section - Always show, allow adding */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '5px' 
            }}>
              <div style={{ fontWeight: 'bold' }}>Notes:</div>
              {!editingNotes && (
                <button
                  onClick={() => {
                    setEditingNotes(true);
                    setEditedNotes(selectedJob.description || '');
                  }}
                  style={{
                    padding: '5px 15px',
                    fontSize: '12px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {selectedJob.description ? 'Edit' : '+ Add'}
                </button>
              )}
            </div>
            
            {editingNotes ? (
              <>
                <textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="Add notes here..."
                  style={{
                    width: '100%',
                    minHeight: '150px',
                    padding: '10px',
                    fontSize: '14px',
                    borderRadius: '5px',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    onClick={() => updateJobNotes(selectedJob, editedNotes)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    💾 Save Notes
                  </button>
                  <button
                    onClick={() => setEditingNotes(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : selectedJob.description ? (
              <div style={{ 
                whiteSpace: 'pre-wrap', 
                backgroundColor: '#fff',
                padding: '10px',
                borderRadius: '5px',
                fontSize: '14px',
                border: '1px solid #e5e7eb'
              }}>
                <div dangerouslySetInnerHTML={{ __html: selectedJob.description || "" }} />
              </div>
            ) : (
              <div style={{ 
                padding: '15px',
                backgroundColor: '#f9fafb',
                borderRadius: '5px',
                fontSize: '14px',
                color: '#9ca3af',
                textAlign: 'center',
                border: '1px dashed #e5e7eb'
              }}>
                No notes yet - tap "+ Add" to add notes
              </div>
            )}
          </div>

          {!isComplete && (
            <button 
              onClick={() => openDispositionModal(selectedJob)}
              style={{
                width: '100%',
                marginBottom: '10px',
                padding: '20px',
                fontSize: '18px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🎯 UPDATE JOB STATUS
            </button>
          )}
          
          {isComplete && (
            <div style={{
              padding: '15px',
              backgroundColor: '#dcfce7',
              borderRadius: '10px',
              textAlign: 'center',
              marginBottom: '10px'
            }}>
              <div style={{ fontSize: '16px', color: '#16a34a', fontWeight: 'bold' }}>✅ Job Complete</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Ready for billing in To Be Billed view</div>
            </div>
          )}
        </div>
       
        <QuickLinksBar />
      </div>
    );
  }

  if (showJobs) {
    const filteredJobs = getFilteredJobs();
    
    const getDateHeader = (job) => {
      const jobDate = new Date(job.start.dateTime || job.start.date);
      return jobDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    let jobsByDate = {};
    if (dayView === 'week') {
      filteredJobs.forEach(job => {
        const dateKey = getDateHeader(job);
        if (!jobsByDate[dateKey]) {
          jobsByDate[dateKey] = [];
        }
        jobsByDate[dateKey].push(job);
      });
    }

    return (
      <div style={{ 
        padding: '20px',
        paddingBottom: '80px',
        maxWidth: '400px',
        margin: '0 auto',
        fontFamily: 'Arial'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>
            {dayView === 'today' && "Today's Jobs"}
            {dayView === 'tomorrow' && "Tomorrow's Jobs"}
            {dayView === 'week' && "This Week"}
          </h2>
          <button 
            onClick={() => {
              setShowJobs(false);
              setFilterType('all');
            }}
            style={{
              padding: '10px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>

        {dayView !== 'week' && (
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '20px'
          }}>
            <button
              onClick={() => viewJobs('today')}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '14px',
                backgroundColor: dayView === 'today' ? '#2563eb' : '#e5e7eb',
                color: dayView === 'today' ? 'white' : '#374151',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: dayView === 'today' ? 'bold' : 'normal'
              }}
            >
              Today
            </button>
            <button
              onClick={() => viewJobs('tomorrow')}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '14px',
                backgroundColor: dayView === 'tomorrow' ? '#2563eb' : '#e5e7eb',
                color: dayView === 'tomorrow' ? 'white' : '#374151',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: dayView === 'tomorrow' ? 'bold' : 'normal'
              }}
            >
              Tomorrow
            </button>
          </div>
        )}

        {/* STATUS FILTER - Shows work status not just job type */}
        <div style={{ 
          display: 'flex', 
          gap: '5px', 
          marginBottom: '10px',
          overflowX: 'auto',
          paddingBottom: '5px'
        }}>
          {[
            { key: 'all', label: 'All', color: '#2563eb' },
            { key: 'overdue', label: '🔴 Not Done', color: '#dc2626' },
            { key: 'scheduled', label: '📅 Scheduled', color: '#db2777' },
            { key: 'needs-review', label: '👀 Review', color: '#16a34a' },
            { key: 'ready-to-bill', label: '💰 Bill', color: '#ea580c' }
          ].map(status => (
            <button
              key={status.key}
              onClick={() => setStatusFilter(status.key)}
              style={{
                padding: '8px 10px',
                fontSize: '11px',
                backgroundColor: statusFilter === status.key ? status.color : '#e5e7eb',
                color: statusFilter === status.key ? 'white' : '#374151',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: statusFilter === status.key ? 'bold' : 'normal'
              }}
            >
              {status.label}
            </button>
          ))}
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '5px', 
          marginBottom: '20px',
          overflowX: 'auto',
          paddingBottom: '5px'
        }}>
          {['all', 'install', 'service', 'sales', 'return'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                backgroundColor: filterType === type ? '#2563eb' : '#e5e7eb',
                color: filterType === type ? 'white' : '#374151',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: filterType === type ? 'bold' : 'normal'
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        
        {filteredJobs.length === 0 ? (
          <p>No {filterType !== 'all' ? filterType : ''} jobs scheduled!</p>
        ) : dayView === 'week' ? (
          Object.keys(jobsByDate).map(dateKey => (
            <div key={dateKey}>
              <h3 style={{ 
                marginTop: '20px', 
                marginBottom: '10px',
                paddingBottom: '10px',
                borderBottom: '2px solid #e5e7eb',
                color: '#374151'
              }}>
                {dateKey}
              </h3>
              {jobsByDate[dateKey].map((job, index) => {
                const isComplete = job.summary.includes('[COMPLETE]');
                const workStatus = getJobWorkStatus(job);
                return (
                  <div 
                    key={index} 
                    onClick={() => setSelectedJob(job)}
                    style={{
                      padding: '15px',
                      marginBottom: '10px',
                      backgroundColor: workStatus.bgColor,
                      borderRadius: '5px',
                      borderLeft: `6px solid ${workStatus.color}`,
                      cursor: 'pointer',
                      opacity: workStatus.status === 'billed' || workStatus.status === 'nc' ? 0.6 : 1
                    }}
                  >
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#666', 
                      marginBottom: '5px',
                      textTransform: 'uppercase',
                      fontWeight: 'bold',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>{getCalendarName(job.calendarId)}</span>
                      <span style={{ 
                        color: workStatus.color, 
                        backgroundColor: workStatus.status === 'overdue' ? '#fef2f2' : 'transparent',
                        padding: workStatus.status === 'overdue' ? '2px 6px' : '0',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: 'bold'
                      }}>
                        {workStatus.label}
                      </span>
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#111827' }}>
                      {getJobUrgency(job) && <span style={{ marginRight: "8px" }}>{getJobUrgency(job) === "red" ? "🔴" : getJobUrgency(job) === "yellow" ? "🟡" : "🟢"}</span>}{job.summary}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                      ⏰ {new Date(job.start.dateTime || job.start.date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                      {extractAddress(job) && (
                        <span style={{ marginLeft: '10px' }}>
                          📍 {extractAddress(job).substring(0, 30)}...
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          filteredJobs.map((job, index) => {
            const isComplete = job.summary.includes('[COMPLETE]');
            const workStatus = getJobWorkStatus(job);
            return (
              <div 
                key={index} 
                onClick={() => setSelectedJob(job)}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: workStatus.bgColor,
                  borderRadius: '5px',
                  borderLeft: `6px solid ${workStatus.color}`,
                  cursor: 'pointer',
                  opacity: workStatus.status === 'billed' || workStatus.status === 'nc' ? 0.6 : 1
                }}
              >
                <div style={{ 
                  fontSize: '10px', 
                  color: '#666', 
                  marginBottom: '5px',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{getCalendarName(job.calendarId)}</span>
                  <span style={{ 
                    color: workStatus.color, 
                    backgroundColor: workStatus.status === 'overdue' ? '#fef2f2' : 'transparent',
                    padding: workStatus.status === 'overdue' ? '2px 6px' : '0',
                    borderRadius: '4px',
                    fontSize: '9px',
                    fontWeight: 'bold'
                  }}>
                    {workStatus.label}
                  </span>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#111827' }}>
                  {getJobUrgency(job) && <span style={{ marginRight: "8px" }}>{getJobUrgency(job) === "red" ? "🔴" : getJobUrgency(job) === "yellow" ? "🟡" : "🟢"}</span>}{job.summary}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                  ⏰ {new Date(job.start.dateTime || job.start.date).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                  {extractAddress(job) && (
                    <span style={{ marginLeft: '10px' }}>
                      📍 {extractAddress(job).substring(0, 30)}...
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}

        <QuickLinksBar />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <div style={{ 
        paddingBottom: '80px',
        maxWidth: '500px',
        margin: '0 auto',
        fontFamily: "'Inter', system-ui, sans-serif",
        background: '#F8F9FA',
        minHeight: '100vh'
      }}>
      {/* Header */}
      <div style={{
        background: '#0A2240',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <img src="/DRH_Logo.png" alt="DRH Security" style={{ height: '45px' }} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px' }}>{userEmail}</div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ 
              padding: '6px 12px', 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              color: 'white', 
              border: '1px solid rgba(255,255,255,0.2)', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontSize: '11px',
              fontWeight: '500'
            }}>Logout</button>
          </div>
        </div>
      </div>

      {/* View Toggle for Super Admin */}
      {canToggleView && (
        <div style={{ padding: '0 20px', marginBottom: '12px' }}>
          <div style={{ 
            backgroundColor: '#0A2240', 
            borderRadius: '10px', 
            padding: '8px',
            display: 'flex',
            gap: '4px'
          }}>
            <button onClick={() => handleViewToggle('admin')} style={{ 
              flex: 1, padding: '8px', fontSize: '11px', fontWeight: '600',
              backgroundColor: viewAs === 'admin' ? '#C41E1E' : 'transparent', 
              color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
            }}>👑 Admin</button>
            <button onClick={() => handleViewToggle('command')} style={{ 
              flex: 1, padding: '8px', fontSize: '11px', fontWeight: '600',
              backgroundColor: viewAs === 'command' ? '#C41E1E' : 'transparent', 
              color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
            }}>📥 Command</button>
            <button onClick={() => handleViewToggle('owner')} style={{ 
              flex: 1, padding: '8px', fontSize: '11px', fontWeight: '600',
              backgroundColor: viewAs === 'owner' ? '#C41E1E' : 'transparent', 
              color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
            }}>🏠 Owner</button>
            <button onClick={() => handleViewToggle('tech')} style={{ 
              flex: 1, padding: '8px', fontSize: '11px', fontWeight: '600',
              backgroundColor: viewAs === 'tech' ? '#C41E1E' : 'transparent', 
              color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
            }}>🔧 Tech</button>
          </div>
        </div>
      )}

      <div style={{ padding: '0 20px' }}>
        
        {/* TECH VIEW - Simple focused cards */}
        {isTech && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div 
                onClick={() => viewJobs('today')}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #2563eb'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>Today's Jobs</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>View schedule</div>
              </div>
              
              <div 
                onClick={() => viewJobs('week')}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #16a34a'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>This Week</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Week view</div>
              </div>
            </div>
            
            <div 
              onClick={() => setShowPastJobs(true)}
              style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '20px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                borderLeft: '4px solid #8b5cf6'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '28px' }}>🕐</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>Past Jobs</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Search history</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* OWNER VIEW (JR) - Sales focused */}
        {effectiveRole === 'owner' && !isTech && (
          <>
            {/* Top row - Today + Sales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div 
                onClick={() => viewJobs('today')}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #2563eb'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>Today's Jobs</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>View schedule</div>
              </div>
              
              <div 
                onClick={fetchSalesQueue}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #ec4899'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>Sales Queue</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Estimates pending</div>
              </div>
            </div>

            {/* Second row - This Week + Past */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div 
                onClick={() => viewJobs('week')}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #16a34a'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>This Week</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Week view</div>
              </div>
              
              <div 
                onClick={() => setShowPastJobs(true)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #8b5cf6'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🕐</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>Past Jobs</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Search history</div>
              </div>
            </div>
          </>
        )}

        {/* COMMAND CENTER VIEW - Dispatch focused */}
        {effectiveRole === 'command' && (
          <>
            {/* Big Dispatch Button */}
            <div 
              onClick={() => fetchDispatchData(90)}
              style={{
                backgroundColor: '#0A2240',
                borderRadius: '16px',
                padding: '24px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(10,34,64,0.3)',
                marginBottom: '12px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>📥</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>DISPATCH CENTER</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>Queue • Schedule • Assign</div>
            </div>

            {/* CMS Signals - Prominent */}
            <div 
              onClick={() => { fetchCmsSignals(); setShowSignals(true); }}
              style={{
                backgroundColor: cmsSignals.length > 0 ? '#fef2f2' : '#fff',
                borderRadius: '16px',
                padding: '16px 20px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                borderLeft: `4px solid ${cmsSignals.length > 0 ? '#dc2626' : '#f59e0b'}`,
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '28px' }}>📡</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>CMS Signals</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>Monitoring alerts</div>
                </div>
              </div>
              {cmsSignals.length > 0 && (
                <div style={{ 
                  backgroundColor: '#dc2626', 
                  color: 'white', 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  fontWeight: 'bold',
                  fontSize: '14px',
                  animation: 'pulse 2s infinite'
                }}>
                  {cmsSignals.length}
                </div>
              )}
            </div>

            {/* 2x2 Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div 
                onClick={openNewServiceCall}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #C41E1E'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔴</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>New Service Call</div>
              </div>
              
              <div 
                onClick={() => fetchToBeBilled(30)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #16a34a'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>💵</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>To Be Billed</div>
              </div>
              
              <div 
                onClick={fetchSalesQueue}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #ec4899'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>💰</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>Sales Queue</div>
              </div>
              
              <div 
                onClick={() => viewJobs('today')}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #2563eb'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>Today's Jobs</div>
              </div>
            </div>

            {/* Bottom row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div 
                onClick={() => viewJobs('week')}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #6b7280'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>📅</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>This Week</span>
                </div>
              </div>
              
              <div 
                onClick={() => setShowPastJobs(true)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #8b5cf6'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>🕐</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>Past Jobs</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ADMIN VIEW - Everything */}
        {effectiveRole === 'admin' && (
          <>
            {/* Big Dispatch Button */}
            <div 
              onClick={() => fetchDispatchData(90)}
              style={{
                backgroundColor: '#0A2240',
                borderRadius: '16px',
                padding: '24px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(10,34,64,0.3)',
                marginBottom: '12px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>📥</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>DISPATCH CENTER</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>Queue • Schedule • Assign</div>
            </div>

            {/* CMS Signals - Prominent */}
            <div 
              onClick={() => { fetchCmsSignals(); setShowSignals(true); }}
              style={{
                backgroundColor: cmsSignals.length > 0 ? '#fef2f2' : '#fff',
                borderRadius: '16px',
                padding: '16px 20px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                borderLeft: `4px solid ${cmsSignals.length > 0 ? '#dc2626' : '#f59e0b'}`,
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '28px' }}>📡</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>CMS Signals</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>Monitoring alerts</div>
                </div>
              </div>
              {cmsSignals.length > 0 && (
                <div style={{ 
                  backgroundColor: '#dc2626', 
                  color: 'white', 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {cmsSignals.length}
                </div>
              )}
            </div>

            {/* Row 1: Service Call + To Be Billed */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div 
                onClick={openNewServiceCall}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #C41E1E'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔴</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>New Service Call</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Log new job</div>
              </div>
              
              <div 
                onClick={() => fetchToBeBilled(30)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #16a34a'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>💵</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>To Be Billed</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Ready for invoicing</div>
              </div>
            </div>

            {/* Row 2: Sales + Today's Jobs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div 
                onClick={fetchSalesQueue}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #ec4899'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>💰</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>Sales Queue</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Estimates pending</div>
              </div>
              
              <div 
                onClick={() => viewJobs('today')}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #2563eb'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📆</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>Today's Jobs</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Scheduled work</div>
              </div>
            </div>

            {/* Row 3: Week + Past */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div 
                onClick={() => viewJobs('week')}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #16a34a'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📅</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>This Week</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Week view</div>
              </div>
              
              <div 
                onClick={() => setShowPastJobs(true)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #8b5cf6'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🕐</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>Past Jobs</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Search history</div>
              </div>
            </div>
          </>
        )}

      </div>
      <QuickLinksBar />
    </div>
    </>
  );
}

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AppContent />
    </GoogleOAuthProvider>
  );
}

export default App;