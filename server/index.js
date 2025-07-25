const express = require('express');
const admin = require('firebase-admin'); // 修正：確保使用 firebase-admin
const cors = require('cors'); // 修正後的引用
const fs = require('fs').promises;

const app = express();
// 暫用全開放 CORS，部署後限制
app.use(cors());
app.use(cors({ origin: ['http://localhost:3000', 'https://<your-frontend>.koyeb.app'] })); //  // 部署後更新為前端 URL
app.use(express.json());

async function initialize() {
  try {
    let serviceAccount;
    if (process.env.FIREBASE_CREDENTIALS) {
      serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    } else {
      const serviceAccount = require('../serviceAccountKey.json');
      console.log('Using serviceAccountKey.json:');
      await fs.readFile(serviceAccount);
      serviceAccount = require('../serviceAccountKey.json');
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://roblox-whitelist-892c2-default-rtdbb.firebaseio.com'
    });
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    throw error;
  }
}

initialize().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

app.post('/generate-code', async (req, res) => {
  try {
    const { plan, guildId, creator, serverName, inviteLink } = req.body;
    const db = admin.database();
    const ref = db.ref('activationCodes');
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const planDurations = {
      '1_month': 30 * 24 * 60 * 60 * 1000,
      '3_months': 90 * 24 * 60 * 60 * 1000,
      '6_months': 180 * 24 * 60 * 60 * 1000,
      '12_months': 365 * 24 * 60 * 60 * 1000
    };
    const expiryDate = Date.now() + (planDurations[plan] || planDurations['1_month']);
    const codeData = {
      code,
      plan,
      guildId: guildId || '',
      serverName: serverName || '',
      inviteLink: inviteLink || '',
      createdBy: creator || 'unknown',
      expiryDate,
      createdAt: Date.now(),
      used: false
    };
    const newCodeRef = ref.push();
    await newCodeRef.set(codeData);
    res.json({ success: true, code });
  } catch (error) {
    console.error('Generate code error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/list-codes', async (req, res) => {
  try {
    const db = admin.database();
    const ref = db.ref('activationCodes');
    const snapshot = await ref.once('value');
    const codes = snapshot.val() || {};
    res.json(codes);
  } catch (error) {
    console.error('List codes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/revoke-code', async (req, res) => {
  try {
    const { code } = req.body;
    console.log('Revoke request received for code:', code);
    const db = admin.database();
    const ref = db.ref('activationCodes');
    const snapshot = await ref.orderByChild('code').equalTo(code).once('value');
    const codes = snapshot.val();
    if (!codes) {
      console.log('Code not found:', code);
      return res.status(404).json({ success: false, error: '啟用碼不存在' });
    }
    const codeKey = Object.keys(codes)[0];
    await ref.child(codeKey).update({ used: false, serverName: '', inviteLink: '' });
    console.log('Code revoked:', code);
    res.json({ success: true, message: `啟用碼 ${code} 已撤銷使用權` });
  } catch (error) {
    console.error('Revoke code error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/test', (req, res) => {
  res.json({ message: 'Test successful' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
