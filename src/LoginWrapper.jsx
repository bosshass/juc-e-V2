import React, { useState, useEffect } from 'react';

const USERS = {
  '1234': { name: 'Sara', role: 'admin' },
  '5678': { name: 'Austin', role: 'tech' },
  '9999': { name: 'JR', role: 'owner' },
  '1111': { name: 'Shana', role: 'admin' }
};

function LoginWrapper({ children }) {
  const [user, setUser] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (USERS[pin]) {
      localStorage.setItem('currentUser', JSON.stringify(USERS[pin]));
      setUser(USERS[pin]);
      setError('');
    } else {
      setError('Invalid PIN');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    setPin('');
  };

  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h2>DRH Security Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={styles.input}
              maxLength="4"
              autoFocus
            />
            <button type="submit" style={styles.button}>Login</button>
            {error && <p style={styles.error}>{error}</p>}
          </form>
          <div style={styles.hint}>Sara: 1234 | Austin: 5678 | JR: 9999</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>DRH Security</h1>
        <div style={styles.userSection}>
          <span>Welcome, {user.name}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>
      {React.cloneElement(children, { currentUser: user })}
    </div>
  );
}

const styles = {
  loginContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' },
  loginBox: { backgroundColor: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '400px', textAlign: 'center' },
  input: { width: '100%', padding: '12px', fontSize: '24px', textAlign: 'center', letterSpacing: '10px', marginBottom: '15px', border: '2px solid #333', borderRadius: '5px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', fontSize: '18px', backgroundColor: '#E33737', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  error: { color: 'red', marginTop: '10px' },
  hint: { marginTop: '20px', fontSize: '12px', color: '#666' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#292929', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  title: { margin: 0, fontSize: '22px' },
  userSection: { display: 'flex', alignItems: 'center', gap: '15px', fontSize: '14px' },
  logoutBtn: { padding: '6px 12px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }
};

export default LoginWrapper;
