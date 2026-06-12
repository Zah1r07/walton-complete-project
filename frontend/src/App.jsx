import React, { useEffect, useMemo, useState } from 'react';
import api, { clearTokens, hasToken, saveTokens } from './api';

const emptyCustomer = { username: '', email: '', first_name: '', last_name: '', role: 'customer', password: '' };
const emptyProduct = { serial: '', name: '', category: '' };
const emptyRegistration = { product: '', purchase_date: '' };
const emptyClaim = { registration: '', description: '' };
const emptyFeedback = { claim: '', rating: 5, comment: '' };

const statusText = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(hasToken());
  const [error, setError] = useState('');

  async function loadSession() {
    if (!hasToken()) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('auth/me/');
      setCurrentUser(response.data);
    } catch {
      clearTokens();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSession();
  }, []);

  async function login(credentials) {
    setError('');
    const tokenResponse = await api.post('auth/login/', credentials);
    saveTokens(tokenResponse.data);
    const userResponse = await api.get('auth/me/');
    setCurrentUser(userResponse.data);
  }

  function logout() {
    clearTokens();
    setCurrentUser(null);
  }

  if (loading) return <div className="loading-screen">Loading portal...</div>;
  if (!currentUser) return <LoginPage onLogin={login} error={error} setError={setError} />;
  if (currentUser.role === 'admin') return <AdminPortal currentUser={currentUser} onLogout={logout} />;
  return <CustomerPortal currentUser={currentUser} onLogout={logout} />;
}

function LoginPage({ onLogin, error, setError }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await onLogin(form);
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-shell">
        <aside className="login-showcase" aria-label="Portal preview">
          <div className="showcase-top">
            <span className="mark">W</span>
            <div>
              <strong>Walton Warranty</strong>
              <small>Fast claims. Clear ownership. Better service.</small>
            </div>
          </div>
          <div className="company-card">
            <span>Company care</span>
            <strong>Electronics, appliances, and service support in one place.</strong>
            <p>Walton customers can register purchases, open warranty claims, and follow service updates from a single secure portal.</p>
            <div className="company-points">
              <small>Product ownership records</small>
              <small>Warranty claim workflow</small>
              <small>Customer feedback tracking</small>
            </div>
          </div>
          <div className="service-steps">
            <span>Register product</span>
            <span>Submit claim</span>
            <span>Track decision</span>
          </div>
        </aside>
        <div className="login-card">
          <div className="brand-line"><span>W</span><div><strong>Walton Warranty</strong><small>Secure service portal</small></div></div>
          <h1>Welcome back</h1>
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={submit} className="form-stack">
            <label>Username<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></label>
            <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
            <button className="primary-btn" disabled={saving}>{saving ? 'Signing in...' : 'Sign in'}</button>
          </form>
        </div>
      </section>
    </main>
  );
}
function AdminPortal({ currentUser, onLogout }) {
  const data = usePortalData();
  const [view, setView] = useState('dashboard');
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [updatingClaimId, setUpdatingClaimId] = useState(null);

  async function createCustomer(event) {
    event.preventDefault();
    await data.save('Customer', () => api.post('users/', customerForm));
    setCustomerForm(emptyCustomer);
  }

  async function createProduct(event) {
    event.preventDefault();
    await data.save('Product', () => api.post('products/', productForm));
    setProductForm(emptyProduct);
  }

  async function updateStatus(claim, status) {
    setUpdatingClaimId(claim.id);
    try {
      await data.save('Claim status', () => api.patch(`claims/${claim.id}/update_status/`, { status }));
    } finally {
      setUpdatingClaimId(null);
    }
  }

  return (
    <Shell title="Admin Dashboard" subtitle="Full warranty desk control" user={currentUser} onLogout={onLogout} nav={['dashboard', 'customers', 'products', 'claims', 'feedback']} view={view} setView={setView}>
      <Messages data={data} />
      {view === 'dashboard' && <AdminDashboard data={data} />}
      {view === 'customers' && <AdminCustomers data={data} form={customerForm} setForm={setCustomerForm} onSubmit={createCustomer} />}
      {view === 'products' && <AdminProducts data={data} form={productForm} setForm={setProductForm} onSubmit={createProduct} />}
      {view === 'claims' && <AdminClaims data={data} updateStatus={updateStatus} updatingClaimId={updatingClaimId} />}
      {view === 'feedback' && <FeedbackList feedback={data.feedback} />}
    </Shell>
  );
}

function CustomerPortal({ currentUser, onLogout }) {
  const data = usePortalData();
  const [view, setView] = useState('dashboard');
  const [registrationForm, setRegistrationForm] = useState(emptyRegistration);
  const [claimForm, setClaimForm] = useState(emptyClaim);
  const [feedbackForm, setFeedbackForm] = useState(emptyFeedback);

  async function registerProduct(event) {
    event.preventDefault();
    await data.save('Registration', () => api.post('registrations/', { ...registrationForm, user: Number(currentUser.id), product: Number(registrationForm.product) }));
    setRegistrationForm(emptyRegistration);
  }

  async function createClaim(event) {
    event.preventDefault();
    await data.save('Claim', () => api.post('claims/', { ...claimForm, registration: Number(claimForm.registration) }));
    setClaimForm(emptyClaim);
  }

  async function createFeedback(event) {
    event.preventDefault();
    await data.save('Feedback', () => api.post('feedback/', { ...feedbackForm, claim: Number(feedbackForm.claim) }));
    setFeedbackForm(emptyFeedback);
  }

  return (
    <Shell title="My Warranty" subtitle="Fast access to your products, claims, and service updates" user={currentUser} onLogout={onLogout} nav={['dashboard', 'register', 'claim', 'feedback']} view={view} setView={setView}>
      <Messages data={data} />
      {view === 'dashboard' && <CustomerDashboard data={data} setView={setView} />}
      {view === 'register' && <RegisterProduct data={data} form={registrationForm} setForm={setRegistrationForm} onSubmit={registerProduct} />}
      {view === 'claim' && <CustomerClaim data={data} form={claimForm} setForm={setClaimForm} onSubmit={createClaim} />}
      {view === 'feedback' && <CustomerFeedback data={data} form={feedbackForm} setForm={setFeedbackForm} onSubmit={createFeedback} />}
    </Shell>
  );
}

function usePortalData() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [claims, setClaims] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [usersRes, productsRes, registrationsRes, claimsRes, feedbackRes] = await Promise.all([
        api.get('users/').catch(() => ({ data: [] })),
        api.get('products/'),
        api.get('registrations/'),
        api.get('claims/'),
        api.get('feedback/'),
      ]);
      setUsers(usersRes.data);
      setProducts(productsRes.data);
      setRegistrations(registrationsRes.data);
      setClaims(claimsRes.data);
      setFeedback(feedbackRes.data);
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setLoading(false);
    }
  }

  async function save(label, request) {
    setNotice('');
    setError('');
    try {
      await request();
      await load();
      setNotice(`${label} saved`);
    } catch (requestError) {
      setError(readError(requestError));
    }
  }

  useEffect(() => { load(); }, []);

  const productsById = useMemo(() => Object.fromEntries(products.map((item) => [item.id, item])), [products]);
  const registrationsById = useMemo(() => Object.fromEntries(registrations.map((item) => [item.id, item])), [registrations]);

  return { users, products, registrations, claims, feedback, loading, notice, error, productsById, registrationsById, load, save };
}

function Shell({ title, subtitle, user, onLogout, nav, view, setView, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar"><div className="brand-line"><span>W</span><div><strong>Walton Care</strong><small>{user.role} portal</small></div></div><nav>{nav.map((item) => <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>{label(item)}</button>)}</nav></aside>
      <main className="workspace"><header className="topbar"><div><p>{subtitle}</p><h1>{title}</h1></div><div className="top-actions"><span>{user.username} - {user.role}</span><button onClick={onLogout}>Logout</button></div></header>{children}</main>
    </div>
  );
}

function Messages({ data }) {
  if (data.loading) return <div className="info-box">Loading data...</div>;
  return <>{data.notice && <div className="notice-box">{data.notice}</div>}{data.error && <div className="error-box">{data.error}</div>}</>;
}

function AdminDashboard({ data }) {
  return <><Stats cards={[['Customers', data.users.length], ['Products', data.products.length], ['Registrations', data.registrations.length], ['Open Claims', data.claims.filter((c) => c.status === 'pending').length]]} /><section className="panel"><h2>Latest claims</h2><ClaimTable claims={data.claims.slice().reverse().slice(0, 8)} productsById={data.productsById} registrationsById={data.registrationsById} /></section></>;
}

function CustomerDashboard({ data, setView }) {
  const pending = data.claims.filter((c) => c.status === 'pending').length;
  return <><div className="quick-actions"><button onClick={() => setView('register')}>Register product</button><button onClick={() => setView('claim')}>Submit claim</button><button onClick={() => setView('feedback')}>Give feedback</button></div><Stats cards={[['My Products', data.registrations.length], ['My Claims', data.claims.length], ['Pending', pending], ['Feedback', data.feedback.length]]} /><section className="panel"><h2>My recent claims</h2><ClaimTable claims={data.claims} productsById={data.productsById} registrationsById={data.registrationsById} /></section></>;
}

function AdminCustomers({ data, form, setForm, onSubmit }) {
  return <div className="two-column"><form className="panel form-stack" onSubmit={onSubmit}><h2>Add customer</h2><Field label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} /><Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} /><Field label="First name" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} /><Field label="Last name" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} /><Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} /><button type="submit" className="primary-btn">Create customer</button></form><section className="panel"><h2>Customers</h2>{data.users.map((user) => <div className="list-row" key={user.id}><strong>{user.username}</strong><span>{user.email || 'No email'} - {user.role}</span></div>)}</section></div>;
}

function AdminProducts({ data, form, setForm, onSubmit }) {
  return <div className="two-column"><form className="panel form-stack" onSubmit={onSubmit}><h2>Add product</h2><Field label="Serial" value={form.serial} onChange={(v) => setForm({ ...form, serial: v })} /><Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} /><Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} /><button type="submit" className="primary-btn">Create product</button></form><ProductList products={data.products} /></div>;
}

function AdminClaims({ data, updateStatus, updatingClaimId }) {
  return <section className="panel"><h2>Claim queue</h2><ClaimTable claims={data.claims} productsById={data.productsById} registrationsById={data.registrationsById} actions={(claim) => <><button type="button" className="mini approve" disabled={updatingClaimId === claim.id || data.loading} onClick={() => updateStatus(claim, 'approved')}>Approve</button><button type="button" className="mini reject" disabled={updatingClaimId === claim.id || data.loading} onClick={() => updateStatus(claim, 'rejected')}>Reject</button></>} /></section>;
}

function RegisterProduct({ data, form, setForm, onSubmit }) {
  return <div className="two-column"><form className="panel form-stack" onSubmit={onSubmit}><h2>Register a product</h2><label>Product<select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} required><option value="">Choose product</option>{data.products.map((p) => <option key={p.id} value={p.id}>{p.name} - {p.serial}</option>)}</select></label><label>Purchase date<input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></label><button type="submit" className="primary-btn">Register product</button></form><ProductList products={data.products} /></div>;
}

function CustomerClaim({ data, form, setForm, onSubmit }) {
  return <form className="panel form-stack narrow" onSubmit={onSubmit}><h2>Submit a claim</h2><label>Registered product<select value={form.registration} onChange={(e) => setForm({ ...form, registration: e.target.value })} required><option value="">Choose registration</option>{data.registrations.map((r) => <option key={r.id} value={r.id}>{r.product_name} - {r.product_serial}</option>)}</select></label><label>Problem description<textarea rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></label><button type="submit" className="primary-btn">Send claim</button></form>;
}

function CustomerFeedback({ data, form, setForm, onSubmit }) {
  return <form className="panel form-stack narrow" onSubmit={onSubmit}><h2>Give feedback</h2><label>Claim<select value={form.claim} onChange={(e) => setForm({ ...form, claim: e.target.value })} required><option value="">Choose claim</option>{data.claims.map((c) => <option key={c.id} value={c.id}>#{c.id} - {c.product_name}</option>)}</select></label><label>Rating<input type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} /></label><label>Comment<textarea rows="5" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} required /></label><button type="submit" className="primary-btn">Submit feedback</button></form>;
}

function Stats({ cards }) { return <div className="stats-grid">{cards.map(([name, value]) => <section className="stat" key={name}><span>{name}</span><strong>{value}</strong></section>)}</div>; }
function ProductList({ products }) { return <section className="panel"><h2>Products</h2>{products.map((p) => <div className="list-row" key={p.id}><strong>{p.name}</strong><span>{p.serial} - {p.category || 'General'}</span></div>)}</section>; }
function FeedbackList({ feedback }) { return <section className="panel"><h2>Feedback</h2>{feedback.map((f) => <div className="list-row" key={f.id}><strong>{f.rating}/5 - {f.sentiment || 'unscored'}</strong><span>{f.comment}</span></div>)}</section>; }
function ClaimTable({ claims, productsById, registrationsById, actions }) { return <div className="table">{claims.map((claim) => { const reg = registrationsById[claim.registration]; const product = productsById[reg?.product]; return <div className="table-row" key={claim.id}><span>#{claim.id}</span><span>{claim.product_name || product?.name || 'Product'}</span><span>{claim.description}</span><span className={`pill ${claim.status}`}>{statusText[claim.status] || claim.status}</span><span>{actions ? actions(claim) : 'View only'}</span></div>; })}</div>; }
function Field({ label, value, onChange, type = 'text' }) { return <label>{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={label !== 'Email' && label !== 'Category'} /></label>; }
function label(value) { return value[0].toUpperCase() + value.slice(1); }
function readError(error) {
  const data = error?.response?.data;
  if (!data) return 'Request failed. Please try again.';
  if (data.detail) return data.detail.includes('No active account') ? 'The username or password is not correct.' : data.detail;
  if (typeof data === 'string') return data;
  return Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
}
