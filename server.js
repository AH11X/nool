const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'nool-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// === AUTH MIDDLEWARE ===
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'غير مسجل الدخول' });
  next();
}
function requireNotGuest(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'غير مسجل الدخول' });
  if (req.session.isGuest) return res.status(403).json({ error: 'سجّل حساب للاستفادة من هذه الميزة' });
  next();
}

// === REGISTER ===
app.post('/api/register', (req, res) => {
  try {
    const { name, email, password, type, university, company_name, commercial_reg, sector } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    if (password.length < 6) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون ٦ أحرف على الأقل' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'الإيميل مستخدم مسبقاً' });

    const hash = bcrypt.hashSync(password, 10);
    const uid = 'user_' + Date.now();
    const letter = name.charAt(0);
    const bgs = [
      'linear-gradient(135deg,#c84b11,#f0a500)','linear-gradient(135deg,#6366f1,#8b5cf6)',
      'linear-gradient(135deg,#0d9488,#3b82f6)','linear-gradient(135deg,#ec4899,#f43f5e)',
      'linear-gradient(135deg,#7c3aed,#a855f7)','linear-gradient(135deg,#10b981,#059669)',
      'linear-gradient(135deg,#2563eb,#06b6d4)','linear-gradient(135deg,#d97706,#dc2626)',
    ];
    const bg = bgs[Math.floor(Math.random() * bgs.length)];
    const icons = ['user','code','palette','brain','brief','globe','star','bulb'];
    const mediaIcon = icons[Math.floor(Math.random() * icons.length)];

    const info = db.prepare(`INSERT INTO users (uid,name,email,password,type,university,company_name,commercial_reg,sector,bg,icon_letter,media_icon,rank_name,rank_icon,cat,title,bio,balance)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'فضي','🥈','other',?,?,250)`)
      .run(uid, name, email, hash, type || 'student', university || '', company_name || '', commercial_reg || '', sector || '', bg, letter, mediaIcon,
        type === 'company' ? (company_name || 'شركة') : 'طالب جديد في نُول',
        type === 'company' ? 'نرحب بانضمامكم لمنصة نُول' : 'عضو جديد في مجتمع نُول');

    req.session.userId = info.lastInsertRowid;
    req.session.userUid = uid;
    req.session.userType = type || 'student';
    req.session.isGuest = false;

    res.json({ success: true, uid, type: type || 'student' });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ في التسجيل: ' + err.message });
  }
});

// === LOGIN ===
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'أدخل الإيميل وكلمة المرور' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(400).json({ error: 'الحساب غير موجود' });

    if (!bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: 'كلمة المرور غير صحيحة' });

    req.session.userId = user.id;
    req.session.userUid = user.uid;
    req.session.userType = user.type;
    req.session.isGuest = false;

    res.json({ success: true, uid: user.uid, type: user.type });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في تسجيل الدخول' });
  }
});

// === GUEST LOGIN ===
app.post('/api/guest', (req, res) => {
  req.session.userId = -1;
  req.session.userUid = 'guest';
  req.session.userType = 'student';
  req.session.isGuest = true;
  res.json({ success: true, uid: 'guest', type: 'student', isGuest: true });
});

// === LOGOUT ===
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// === ME ===
app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.json({ loggedIn: false });
  if (req.session.isGuest) {
    return res.json({ loggedIn: true, isGuest: true, uid: 'guest', type: 'student',
      user: { uid:'guest', name:'ضيف', bg:'linear-gradient(135deg,#94a3b8,#64748b)', icon_letter:'ض', media_icon:'user',
        rank_name:'ضيف', rank_icon:'👤', cat:'other', title:'زائر', bio:'أنت تتصفح كضيف', learn_count:0, teach_count:0, rating:0, balance:0 }
    });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!user) return res.json({ loggedIn: false });
  const { password, ...safe } = user;
  res.json({ loggedIn: true, isGuest: false, uid: user.uid, type: user.type, user: safe });
});

// === USERS LIST ===
app.get('/api/users', (req, res) => {
  const { cat, sort, search } = req.query;
  let query = 'SELECT * FROM users WHERE uid != "guest" AND is_guest = 0';
  const params = [];
  if (cat && cat !== 'all') { query += ' AND cat = ?'; params.push(cat); }
  if (search) { query += ' AND (name LIKE ? OR title LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (sort === 'trainees') query += ' ORDER BY teach_count DESC';
  else if (sort === 'rank') query += ' ORDER BY CASE rank_name WHEN "ماسي" THEN 3 WHEN "ذهبي" THEN 2 ELSE 1 END DESC';
  else if (sort === 'rating') query += ' ORDER BY rating DESC';
  else query += ' ORDER BY id DESC';

  const users = db.prepare(query).all(...params);
  // Attach skills, reviews, post for each user
  const stmtSkills = db.prepare('SELECT * FROM skills WHERE user_id = ?');
  const stmtReviews = db.prepare('SELECT * FROM reviews WHERE user_id = ?');
  const stmtPost = db.prepare('SELECT * FROM posts WHERE user_id = ? LIMIT 1');

  const result = users.map(u => {
    const { password, ...safe } = u;
    safe.taught = stmtSkills.all(u.id).filter(s => s.type === 'taught');
    safe.learned = stmtSkills.all(u.id).filter(s => s.type === 'learned');
    safe.reviews = stmtReviews.all(u.id);
    safe.post = stmtPost.get(u.id) || null;
    return safe;
  });
  res.json(result);
});

// === SINGLE USER ===
app.get('/api/users/:uid', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE uid = ?').get(req.params.uid);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
  const { password, ...safe } = user;
  safe.taught = db.prepare('SELECT * FROM skills WHERE user_id = ? AND type = "taught"').all(user.id);
  safe.learned = db.prepare('SELECT * FROM skills WHERE user_id = ? AND type = "learned"').all(user.id);
  safe.reviews = db.prepare('SELECT * FROM reviews WHERE user_id = ?').all(user.id);
  safe.post = db.prepare('SELECT * FROM posts WHERE user_id = ? LIMIT 1').get(user.id) || null;
  res.json(safe);
});

// === SKILLS ===
app.post('/api/skills', requireNotGuest, (req, res) => {
  const { name, icon, type } = req.body;
  db.prepare('INSERT INTO skills (user_id,icon,name,student_count,type) VALUES (?,?,?,0,?)')
    .run(req.session.userId, icon || 'star', name, type || 'taught');
  res.json({ success: true });
});

// === PROJECTS ===
app.get('/api/projects', (req, res) => {
  res.json(db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all());
});
app.post('/api/projects', requireNotGuest, (req, res) => {
  const { company, icon, cat, title, budget, duration, description } = req.body;
  db.prepare('INSERT INTO projects (company,icon,cat,title,budget,duration,description) VALUES (?,?,?,?,?,?,?)')
    .run(company, icon || 'building', cat, title, budget, duration, description);
  res.json({ success: true });
});

// === MESSAGES ===
app.get('/api/messages/:uid', requireNotGuest, (req, res) => {
  const other = db.prepare('SELECT id FROM users WHERE uid = ?').get(req.params.uid);
  if (!other) return res.json([]);
  const msgs = db.prepare(`SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC`)
    .all(req.session.userId, other.id, other.id, req.session.userId);
  res.json(msgs);
});
app.post('/api/messages', requireNotGuest, (req, res) => {
  const { receiver_uid, text } = req.body;
  const receiver = db.prepare('SELECT id FROM users WHERE uid = ?').get(receiver_uid);
  if (!receiver) return res.status(400).json({ error: 'المستخدم غير موجود' });
  db.prepare('INSERT INTO messages (sender_id,receiver_id,text) VALUES (?,?,?)')
    .run(req.session.userId, receiver.id, text);
  res.json({ success: true });
});

// === SERVICE REQUESTS ===
app.get('/api/requests', requireNotGuest, (req, res) => {
  const requests = db.prepare(`
    SELECT sr.*, u.name as sender_name, u.media_icon, u.bg
    FROM service_requests sr
    JOIN users u ON sr.sender_id = u.id
    WHERE sr.receiver_id = ?
    ORDER BY sr.created_at DESC
  `).all(req.session.userId);
  res.json(requests);
});
app.post('/api/requests', requireNotGuest, (req, res) => {
  const { receiver_uid, service_name } = req.body;
  const receiver = db.prepare('SELECT id FROM users WHERE uid = ?').get(receiver_uid);
  if (!receiver) return res.status(400).json({ error: 'المستخدم غير موجود' });
  db.prepare('INSERT INTO service_requests (sender_id,receiver_id,service_name) VALUES (?,?,?)')
    .run(req.session.userId, receiver.id, service_name || 'طلب خدمة عامة');
  res.json({ success: true });
});
app.post('/api/requests/:id/action', requireNotGuest, (req, res) => {
  const { action } = req.body; // 'accepted' or 'rejected'
  const reqId = req.params.id;
  db.prepare('UPDATE service_requests SET status = ? WHERE id = ? AND receiver_id = ?')
    .run(action, reqId, req.session.userId);
  res.json({ success: true });
});

// === NOTIFICATIONS ===
app.get('/api/notifications', requireAuth, (req, res) => {
  if (req.session.isGuest) return res.json([]);
  // Return default notifications
  const notifs = [
    { title:'تم قبول طلب التعلم من سارة أحمد', subtitle:'Python & Data Analysis', time_text:'منذ ١٥ دقيقة', icon:'check', color:'var(--green)' },
    { title:'تقييم جديد ٥ نجوم من ياسر فهد', subtitle:'شرح عملي وسريع!', time_text:'منذ ساعتين', icon:'star', color:'var(--gold)' },
    { title:'موعد جلستك غداً الساعة ٤ مساءً', subtitle:'مع لمى سعد - Solarpunk Design', time_text:'أمس', icon:'clock', color:'var(--accent)' },
    { title:'وصلت للمرتبة الثانية في المتصدرين!', subtitle:'استمر في التدريب', time_text:'منذ ٣ أيام', icon:'trophy', color:'var(--gold)' },
    { title:'+١٥٠ نقطة نُول في محفظتك', subtitle:'مكافأة إكمال مهمة', time_text:'منذ ٤ أيام', icon:'wallet', color:'var(--green)' },
  ];
  res.json(notifs);
});

// === WALLET ===
app.get('/api/wallet', requireNotGuest, (req, res) => {
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.session.userId);
  let transactions = db.prepare('SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY id DESC').all(req.session.userId);
  if (!transactions.length) {
    transactions = [
      { title:'مكافأة التسجيل في نُول', date_text:'عند التسجيل', amount:'+٢٥٠', is_positive:1 }
    ];
  }
  res.json({ balance: user?.balance || 0, transactions });
});

// === LEADERBOARD ===
app.get('/api/leaderboard', (req, res) => {
  const users = db.prepare('SELECT uid,name,bg,icon_letter,media_icon,rank_name,rank_icon,teach_count,rating FROM users WHERE uid != "guest" AND is_guest = 0 ORDER BY teach_count DESC').all();
  res.json(users);
});

// === CATCH ALL ===
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🧶 نُول يعمل على المنفذ ${PORT}\n`);
});
