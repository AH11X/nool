const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'nool.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// === CREATE TABLES ===
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  password TEXT,
  type TEXT DEFAULT 'student',
  university TEXT,
  company_name TEXT,
  commercial_reg TEXT,
  sector TEXT,
  bg TEXT DEFAULT 'linear-gradient(135deg,#c84b11,#f0a500)',
  icon_letter TEXT DEFAULT '؟',
  media_icon TEXT DEFAULT 'user',
  rank_name TEXT DEFAULT 'فضي',
  rank_icon TEXT DEFAULT '🥈',
  cat TEXT DEFAULT 'other',
  title TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  learn_count INTEGER DEFAULT 0,
  teach_count INTEGER DEFAULT 0,
  rating REAL DEFAULT 4.5,
  balance INTEGER DEFAULT 250,
  is_guest INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  icon TEXT DEFAULT 'star',
  name TEXT NOT NULL,
  student_count INTEGER DEFAULT 0,
  type TEXT DEFAULT 'taught'
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  reviewer_name TEXT,
  stars TEXT,
  text TEXT
);
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT,
  icon TEXT DEFAULT 'building',
  cat TEXT,
  title TEXT,
  budget TEXT,
  duration TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER,
  receiver_id INTEGER,
  text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  title TEXT,
  subtitle TEXT,
  time_text TEXT,
  icon TEXT,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  title TEXT,
  date_text TEXT,
  amount TEXT,
  is_positive INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  icon TEXT,
  type TEXT,
  description TEXT
);
`);

// === SEED DATA ===
function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (count > 0) return;

  const hash = bcrypt.hashSync('123456', 10);
  const insertUser = db.prepare(`INSERT INTO users (uid,name,email,password,type,bg,icon_letter,media_icon,rank_name,rank_icon,cat,title,bio,learn_count,teach_count,rating,balance) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insertSkill = db.prepare(`INSERT INTO skills (user_id,icon,name,student_count,type) VALUES (?,?,?,?,?)`);
  const insertReview = db.prepare(`INSERT INTO reviews (user_id,reviewer_name,stars,text) VALUES (?,?,?,?)`);
  const insertPost = db.prepare(`INSERT INTO posts (user_id,icon,type,description) VALUES (?,?,?,?)`);
  const insertProject = db.prepare(`INSERT INTO projects (company,icon,cat,title,budget,duration,description) VALUES (?,?,?,?,?,?,?)`);

  const users = [
    ['me','أحمد خالد','ahmed@mu.edu.sa',hash,'student','linear-gradient(135deg,#c84b11,#f0a500)','أ','box3d','ذهبي','🌟','design','طالب معماري | Solarpunk Design','شغوف بتصميم الفراغات وأشارك زملائي مهارات 3D Modeling.',2,28,4.8,350],
    ['ghusoon','غصون عطيه','ghusoon@mu.edu.sa',hash,'student','linear-gradient(135deg,#c026d3,#db2777)','غ','calc','فضي','🥈','math','رياضيات | تفاضل وتكامل','متخصصة في الرياضيات الجامعية.',6,18,4.6,200],
    ['lama','لمى سعد','lama@mu.edu.sa',hash,'student','linear-gradient(135deg,#0d9488,#3b82f6)','ل','layers','ماسي','💎','design','تصميم داخلي | Space Age & Solarpunk','مصممة داخلية شغوفة بالأنماط المستقبلية.',5,55,4.9,500],
    ['faisal','فيصل خالد','faisal@mu.edu.sa',hash,'student','linear-gradient(135deg,#d97706,#dc2626)','ف','brief','ذهبي','🌟','business','إدارة أعمال | ريادة وأعمال عن بُعد','متخصص في التنظيم الإداري والعمل الرقمي.',4,40,4.7,300],
    ['sara','سارة أحمد','sara@mu.edu.sa',hash,'student','linear-gradient(135deg,#6366f1,#8b5cf6)','س','activity','ماسي','💎','coding','محللة بيانات | Excel & Python & Power BI','متخصصة في تحليل البيانات والذكاء التجاري.',10,120,5.0,800],
    ['yasser','ياسر فهد','yasser@mu.edu.sa',hash,'student','linear-gradient(135deg,#2563eb,#06b6d4)','ي','anchor','ذهبي','🌟','design','هندسة مدنية | AutoCAD & Revit','مهندس مدني يجمع بين الرسم الهندسي والبرمجة.',6,30,4.6,250],
    ['raghad','رغد صالح','raghad@mu.edu.sa',hash,'student','linear-gradient(135deg,#ec4899,#f43f5e)','ر','clip','ذهبي','🌟','other','موارد بشرية | تطوير وظيفي وCV','أساعدك تبني مسارك المهني من الصفر.',8,60,4.8,400],
    ['shahad','شهد محمد','shahad@mu.edu.sa',hash,'student','linear-gradient(135deg,#10b981,#059669)','ش','palette','ذهبي','🌟','design','مصممة واجهات | UI/UX & Figma & Framer','متخصصة في تجربة المستخدم.',5,45,4.9,350],
    ['khaled','خالد الدوسري','khaled@mu.edu.sa',hash,'student','linear-gradient(135deg,#e11d48,#be123c)','خ','box3d','فضي','🥈','math','هندسة مدنية | ميكانيكا واستاتيكا','متخصص في مواد الهندسة المدنية.',10,15,4.4,150],
    ['mona','منى اليوسف','mona@mu.edu.sa',hash,'student','linear-gradient(135deg,#7c3aed,#6d28d9)','م','mic','ذهبي','🌟','lang','لغات | إنجليزي للأعمال & IELTS','معلمة لغة إنجليزية متخصصة.',15,35,4.7,280],
    ['majed','ماجد فهد','majed@mu.edu.sa',hash,'student','linear-gradient(135deg,#047857,#065f46)','م','shield','ماسي','💎','cyber','أمن سيبراني | Ethical Hacking & CCNA','متخصص في أمن المعلومات والشبكات.',20,90,4.9,600],
    ['ziyad','زياد طارق','ziyad@mu.edu.sa',hash,'student','linear-gradient(135deg,#4338ca,#1e1b4b)','ز','brain','ذهبي','🌟','ai','ذكاء اصطناعي | Prompt Engineering & LLMs','مهتم بالذكاء الاصطناعي وهندسة الأوامر.',15,65,4.8,450],
    ['tariq','طارق زياد','tariq@mu.edu.sa',hash,'student','linear-gradient(135deg,#0369a1,#1e3a8a)','ط','film','ذهبي','🌟','media','مونتاج سينمائي | Premiere & After Effects','مونتير محترف.',5,45,4.7,320],
    ['sami','سامي عبدالرحمن','sami@mu.edu.sa',hash,'student','linear-gradient(135deg,#15803d,#064e3b)','س','calc','ماسي','💎','math','رياضيات وفيزياء | Calculus & Engineering Physics','الأول في رياضيات الجامعة لمدة 4 سنوات.',3,150,5.0,900],
    ['nouf','نوف العبدالله','nouf@mu.edu.sa',hash,'student','linear-gradient(135deg,#be185d,#9d174d)','ن','camera','ذهبي','🌟','media','تصوير إبداعي | Photography & Lightroom','مصورة احترافية.',7,38,4.8,300],
    ['saad','سعد العتيبي','saad@mu.edu.sa',hash,'student','linear-gradient(135deg,#0369a1,#0284c7)','س','code','ذهبي','🌟','coding','تطوير ويب | React & Node.js & TypeScript','مطور Full Stack.',12,55,4.8,400],
    ['huda','هدى محمد','huda@mu.edu.sa',hash,'student','linear-gradient(135deg,#b45309,#d97706)','هـ','mic','ذهبي','🌟','other','قيادة وتواصل | Public Speaking & Leadership','مدربة معتمدة.',9,62,4.9,420],
    ['omar','عمر البلوي','omar@mu.edu.sa',hash,'student','linear-gradient(135deg,#7c3aed,#a855f7)','ع','cpu','ماسي','💎','coding','تطوير موبايل | Flutter & Dart & Firebase','مطور تطبيقات موبايل.',8,78,4.9,550],
    ['laila','ليلى الشمري','laila@mu.edu.sa',hash,'student','linear-gradient(135deg,#0891b2,#0e7490)','ل','globe','ذهبي','🌟','lang','لغة فرنسية | من المبتدئين للـ B2','خريجة ترجمة فرنسية.',11,33,4.6,220],
    ['aisha','عائشة القحطاني','aisha@mu.edu.sa',hash,'student','linear-gradient(135deg,#16a34a,#4ade80)','ع','bulb','ذهبي','🌟','business','تسويق رقمي | Social Media & Content','متخصصة في التسويق الرقمي.',6,48,4.8,350],
    ['khalid2','خالد العنزي','khalid2@mu.edu.sa',hash,'student','linear-gradient(135deg,#1e40af,#1e3a8a)','خ','layers','ماسي','💎','coding','DevOps & Cloud | AWS & Docker & Kubernetes','متخصص في البنية التحتية السحابية.',5,82,4.9,600],
    ['bandar','بندر العسيري','bandar@mu.edu.sa',hash,'student','linear-gradient(135deg,#1d4ed8,#1e40af)','ب','cpu','ماسي','💎','coding','تطوير ألعاب | Unity & C# & Godot','مطور ألعاب متخصص.',8,73,4.9,500],
  ];

  const transaction = db.transaction(() => {
    for (const u of users) {
      const info = insertUser.run(...u);
      const userId = info.lastInsertRowid;
      seedUserData(userId, u[0], insertSkill, insertReview, insertPost);
    }
    // Projects
    const projects = [
      ['شركة التقنية الحديثة','building','design','تصميم واجهة تطبيق توصيل طلبات','١٥٠٠','أسبوعين','مصمم UI/UX لبناء شاشات تطبيق توصيل باستخدام Figma.'],
      ['مؤسسة الأفق للتجارة','brief','coding','تحليل بيانات مبيعات - Power BI','٨٠٠','أسبوع','نحتاج Excel وPower BI لتحليل بيانات مبيعات.'],
      ['ستارت أب بايتكس','code','coding','تطوير Landing Page بـ React & Next.js','١٢٠٠','أسبوع','مطلوب مطور Front-End لبناء صفحة هبوط احترافية.'],
      ['أكاديمية نماء التعليمية','layers','media','إنتاج ٥ فيديوهات تعليمية قصيرة','٢٠٠٠','أسبوعين','فيديوهات تعليمية مع animations وMotion Graphics.'],
      ['شركة سبا للاستشارات','brief','business','إدارة السوشال ميديا لشهر','٩٠٠','شهر','إدارة Instagram وLinkedIn مع إنتاج محتوى.'],
    ];
    for (const p of projects) insertProject.run(...p);
  });
  transaction();
}

function seedUserData(userId, uid, insertSkill, insertReview, insertPost) {
  const data = {
    me: { taught:[['box3d','3D Modeling - Rhino',15],['layers','تصميم مساحات بـ Coohom',13]], learned:[['activity','تحليل بيانات Excel',0]], reviews:[['ياسر فهد','⭐⭐⭐⭐⭐','أحمد مبدع جداً.'],['غصون عطيه','⭐⭐⭐⭐','شرح واضح وأسلوب ممتاز.']], post:['box3d','جلسة إرشادية','جلسة تعليم أساسيات 3D Modeling وتصميم الفراغات.'] },
    ghusoon: { taught:[['calc','تفاضل وتكامل 101',12],['activity','جبر خطي',6]], learned:[['code','أساسيات بايثون',0]], reviews:[['لمى سعد','⭐⭐⭐⭐','شرحها واضح ومبسط.'],['سعد العتيبي','⭐⭐⭐⭐','فهمت Calculus من أساسه.']], post:['calc','مراجعة أكاديمية','مراجعة شاملة لأساسيات التفاضل والتكامل.'] },
    lama: { taught:[['layers','Solarpunk Design',30],['palette','Space Age Interiors',25]], learned:[['palette','Color Theory Advanced',0]], reviews:[['نوف العبدالله','⭐⭐⭐⭐⭐','أفضل مدربة التقيت بها.'],['أحمد خالد','⭐⭐⭐⭐⭐','ما توقعت أتعلم كل هذا!']], post:['layers','جلسة ساعتين','جلسة فردية تتعلم فيها أحدث استايلات التصميم المستقبلي.'] },
    faisal: { taught:[['brief','إدارة الملفات السحابية',25],['anchor','العمل الإداري عن بُعد',15]], learned:[['globe','كتابة إيميلات رسمية',0]], reviews:[['رغد صالح','⭐⭐⭐⭐⭐','نظّم لي طريقة عملي.'],['منى اليوسف','⭐⭐⭐⭐','ورشة ممتازة ومفيدة.']], post:['brief','ورشة تدريبية','ورشة شاملة لمهارات الإدارة والعمل عن بُعد.'] },
    sara: { taught:[['activity','Excel للمحترفين',70],['code','Python & Data Analysis',35],['cpu','Power BI Dashboard',15]], learned:[['brain','Machine Learning Basics',0]], reviews:[['أحمد خالد','⭐⭐⭐⭐⭐','دورة الإكسل خرافية!'],['ياسر فهد','⭐⭐⭐⭐⭐','أفضل دورة Python.']], post:['activity','معسكر مكثف','معسكر تحليل البيانات الكامل.'] },
    yasser: { taught:[['anchor','AutoCAD للمبتدئين',20],['box3d','Revit Architecture',10]], learned:[['brain','AI في الهندسة',0]], reviews:[['سعد العتيبي','⭐⭐⭐⭐','شرح عملي وسريع.'],['خالد الدوسري','⭐⭐⭐⭐','أفضل شخص يشرح AutoCAD.']], post:['anchor','ورشة تدريبية','أساسيات AutoCAD للطلاب الجدد.'] },
    raghad: { taught:[['clip','كتابة CV احترافي',40],['mic','تجاوز مقابلات العمل',20]], learned:[['activity','تحليل بيانات HR',0]], reviews:[['منى اليوسف','⭐⭐⭐⭐⭐','انقبلت في تدريب تعاوني بفضل رغد!'],['سامي عبدالرحمن','⭐⭐⭐⭐⭐','حسّنت CV بطريقة ما توقعتها.']], post:['clip','استشارة مهنية','جلسة مراجعة شاملة لـ CV وLinkedIn.'] },
    shahad: { taught:[['palette','UI/UX مع Figma',30],['layers','تصميم تطبيقات موبايل',15]], learned:[['cpu','Framer Web Design',0]], reviews:[['لمى سعد','⭐⭐⭐⭐⭐','شهد استثنائية في الشرح.'],['فيصل خالد','⭐⭐⭐⭐⭐','بنيت أول App Design!']], post:['palette','جلسة إرشادية','تصميم واجهات تطبيقات موبايل باستخدام Figma.'] },
    khaled: { taught:[['box3d','مراجعة استاتيكا',15]], learned:[['anchor','AutoCAD مستوى متقدم',0]], reviews:[['ياسر فهد','⭐⭐⭐⭐','ساعدني كثيراً قبل الاختبار.']], post:['box3d','مراجعة أكاديمية','مراجعة مكثفة لمادة الاستاتيكا.'] },
    mona: { taught:[['mic','محادثة إنجليزي Business',20],['pencil','IELTS Preparation',15]], learned:[['globe','لغة فرنسية - مستوى A2',0]], reviews:[['هدى محمد','⭐⭐⭐⭐⭐','أسلوبها ممتع وتفاعلي.'],['رغد صالح','⭐⭐⭐⭐','تحسّن مستواي بالإنجليزي.']], post:['mic','جلسة إرشادية','جلسات محادثة إنجليزي للأعمال.'] },
    majed: { taught:[['shield','Ethical Hacking',50],['cpu','CCNA Networking',40]], learned:[['layers','Cloud Security AWS',0]], reviews:[['سعد العتيبي','⭐⭐⭐⭐⭐','معلومات دسمة ومفيدة.'],['زياد طارق','⭐⭐⭐⭐⭐','ماجد فتح لي باب Cybersecurity!']], post:['shield','معسكر تدريبي','معسكر الأمن السيبراني الكامل.'] },
    ziyad: { taught:[['brain','Prompt Engineering Pro',40],['cpu','LangChain & AI Agents',25]], learned:[['code','Python للـ ML',0]], reviews:[['فيصل خالد','⭐⭐⭐⭐⭐','اختصر علي وقت طويل في AI.'],['سارة أحمد','⭐⭐⭐⭐⭐','زياد فاهم AI من جذوره.']], post:['brain','ورشة تدريبية','ورشة Prompt Engineering المتقدم.'] },
    tariq: { taught:[['film','Adobe Premiere Pro',30],['layers','After Effects Motion',15]], learned:[['camera','تصوير احترافي',0]], reviews:[['أحمد خالد','⭐⭐⭐⭐','أول فيديو محترف بعد 3 جلسات.'],['شهد محمد','⭐⭐⭐⭐⭐','طارق يشرح AE بأسلوب فريد.']], post:['film','ورشة تدريبية','تعلم Premiere Pro وAfter Effects.'] },
    sami: { taught:[['calc','مراجعة Calculus 1',90],['activity','مراجعة Calculus 2',60]], learned:[['cpu','برمجة MATLAB',0]], reviews:[['ماجد فهد','⭐⭐⭐⭐⭐','أنقذني في الميدتيرم!'],['سارة أحمد','⭐⭐⭐⭐⭐','سامي موهوب بالتدريس.']], post:['calc','مراجعة أكاديمية','مراجعة Calculus 1 و 2 وفيزياء هندسية.'] },
    nouf: { taught:[['camera','Photography Basics',25],['layers','Lightroom Pro Editing',13]], learned:[['film','فيديو سينمائي',0]], reviews:[['طارق زياد','⭐⭐⭐⭐⭐','شرح لا يُنسى.'],['شهد محمد','⭐⭐⭐⭐⭐','تعلمت Lightroom في جلسة!']], post:['camera','ورشة ميدانية','ورشة تصوير ميدانية داخل الحرم.'] },
    saad: { taught:[['code','React Modern Development',35],['cpu','Node.js & Express API',20]], learned:[['layers','AWS & Cloud Deployment',0]], reviews:[['ماجد فهد','⭐⭐⭐⭐⭐','طريقة شرحه للـ React ما شفتها عند أحد.'],['زياد طارق','⭐⭐⭐⭐','كورس Node منظم.']], post:['code','كورس مكثف','كورس Full Stack: React, Node.js, PostgreSQL.'] },
    huda: { taught:[['mic','Public Speaking',42],['anchor','مهارات التفاوض',20]], learned:[['pencil','كتابة إبداعية',0]], reviews:[['رغد صالح','⭐⭐⭐⭐⭐','هدى غيّرت تعاملي مع الجمهور.'],['منى اليوسف','⭐⭐⭐⭐⭐','مليئة بالتقنيات العملية.']], post:['mic','جلسة تدريبية','جلسة Public Speaking وفن الإلقاء.'] },
    omar: { taught:[['cpu','Flutter UI Development',50],['layers','Firebase & Backend',28]], learned:[['brain','ML Kit في Flutter',0]], reviews:[['سعد العتيبي','⭐⭐⭐⭐⭐','يبني معك تطبيق حقيقي.'],['شهد محمد','⭐⭐⭐⭐⭐','أفضل من كورسات يوتيوب!']], post:['cpu','كورس كامل','كورس Flutter الكامل.'] },
    laila: { taught:[['globe','French A1 - A2',22],['pencil','French Grammar B1',11]], learned:[['mic','ألمانية - مستوى A1',0]], reviews:[['منى اليوسف','⭐⭐⭐⭐','أسلوبها ممتع.'],['نوف العبدالله','⭐⭐⭐⭐⭐','تعلمت الفرنسية في شهر!']], post:['globe','جلسة تعلّم','دروس فرنسية مخصصة A1 إلى B2.'] },
    aisha: { taught:[['bulb','Social Media Marketing',30],['pencil','Content Strategy & Copywriting',18]], learned:[['activity','Google Analytics',0]], reviews:[['فيصل خالد','⭐⭐⭐⭐⭐','غيّرت استراتيجية التسويق!'],['هدى محمد','⭐⭐⭐⭐','مليئة بالأمثلة الواقعية.']], post:['bulb','ورشة تسويق','ورشة التسويق الرقمي الكاملة.'] },
    khalid2: { taught:[['layers','AWS Cloud Practitioner',45],['cpu','Docker & Kubernetes',37]], learned:[['shield','Cloud Security',0]], reviews:[['سعد العتيبي','⭐⭐⭐⭐⭐','يشرح Kubernetes بطريقة مبسطة!'],['عمر البلوي','⭐⭐⭐⭐⭐','معسكر AWS غيّر مساري.']], post:['layers','معسكر DevOps','معسكر DevOps الكامل.'] },
    bandar: { taught:[['cpu','Unity 2D Game Development',48],['layers','Unity 3D & Shaders',25]], learned:[['code','Godot & GDScript',0]], reviews:[['عمر البلوي','⭐⭐⭐⭐⭐','بندر علّمني أصنع لعبة.'],['ناصر العمري','⭐⭐⭐⭐⭐','أفضل كورس Unity عربي!']], post:['cpu','كورس ألعاب','كورس Unity الكامل.'] },
  };

  const d = data[uid];
  if (!d) return;
  if (d.taught) d.taught.forEach(s => insertSkill.run(userId, s[0], s[1], s[2], 'taught'));
  if (d.learned) d.learned.forEach(s => insertSkill.run(userId, s[0], s[1], s[2], 'learned'));
  if (d.reviews) d.reviews.forEach(r => insertReview.run(userId, r[0], r[1], r[2]));
  if (d.post) insertPost.run(userId, d.post[0], d.post[1], d.post[2]);
}

seedIfEmpty();
module.exports = db;
