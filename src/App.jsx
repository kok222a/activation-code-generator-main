import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const API_URL = '';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [codes, setCodes] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [plan, setPlan] = useState('1_month');
  const [guildId, setGuildId] = useState('');
  const [serverName, setServerName] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [creator, setCreator] = useState('');

  const handleLogin = () => {
    if (password === 'vv97163165') {
      setIsAuthenticated(true);
      setError('');
      toast.success('登錄成功！', { autoClose: 3000 });
    } else {
      setError('密碼錯誤');
      toast.error('密碼錯誤', { autoClose: 3000 });
    }
  };

  const fetchCodes = async () => {
    try {
      console.log('Fetching codes...');
      const response = await axios.get(`${API_URL}/list-codes`);
      console.log('List codes result:', response.data);
      setCodes(response.data);
      setError('');
    } catch (err) {
      console.error('Fetch codes error:', err);
      setError(`無法獲取啟用碼清單：${err.message}`);
      toast.error(`無法獲取啟用碼清單：${err.message}`, { autoClose: 3000 });
    }
  };

  const generateCode = async () => {
    try {
      console.log('Generating code with:', { plan, guildId, serverName, inviteLink, creator });
      const response = await axios.post(`${API_URL}/generate-code`, {
        plan,
        guildId,
        serverName,
        inviteLink,
        creator
      });
      console.log('Generate code result:', response.data);
      setSuccess(`啟用碼 ${response.data.code} 生成成功！`);
      toast.success(`啟用碼 ${response.data.code} 生成成功！`, { autoClose: 3000 });
      setError('');
      fetchCodes();
    } catch (err) {
      console.error('Generate code error:', err);
      setError(`生成啟用碼失敗：${err.message}`);
      toast.error(`生成啟用碼失敗：${err.message}`, { autoClose: 3000 });
      setSuccess('');
    }
  };

  const revokeCode = async (code) => {
    try {
      console.log('Revoking code:', code);
      const response = await axios.post(`${API_URL}/revoke-code`, { code });
      console.log('Revoke code result:', response.data);
      setSuccess(response.data.message);
      toast.success(response.data.message, { autoClose: 3000 });
      setError('');
      fetchCodes();
    } catch (err) {
      console.error('Revoke code error:', err);
      setError(`撤銷啟用碼失敗：${err.message}`);
      toast.error(`撤銷啟用碼失敗：${err.message}`, { autoClose: 3000 });
      setSuccess('');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCodes();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container">
        <h1>啟用碼生成器</h1>
        <div className="login-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="請輸入密碼"
          />
          <button onClick={handleLogin} className="btn-primary">
            登錄
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>啟用碼生成器</h1>
      <div className="form-group">
        <label>選擇方案</label>
        <select value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="1_month">1 個月</option>
          <option value="3_months">3 個月</option>
          <option value="6_months">6 個月</option>
          <option value="12_months">12 個月</option>
        </select>
      </div>
      <div className="form-group">
        <label>伺服器 ID</label>
        <input
          type="text"
          value={guildId}
          onChange={(e) => setGuildId(e.target.value)}
          placeholder="輸入伺服器 ID（可選）"
        />
      </div>
      <div className="form-group">
        <label>伺服器名稱</label>
        <input
          type="text"
          value={serverName}
          onChange={(e) => setServerName(e.target.value)}
          placeholder="輸入伺服器名稱（可選）"
        />
      </div>
      <div className="form-group">
        <label>邀請連結</label>
        <input
          type="text"
          value={inviteLink}
          onChange={(e) => setInviteLink(e.target.value)}
          placeholder="輸入邀請連結（可選）"
        />
      </div>
      <div className="form-group">
        <label>創建者</label>
        <input
          type="text"
          value={creator}
          onChange={(e) => setCreator(e.target.value)}
          placeholder="輸入創建者名稱"
        />
      </div>
      <button onClick={generateCode} className="btn-primary">
        生成啟用碼
      </button>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <h2>啟用碼清單</h2>
      <table className="codes-table">
        <thead>
          <tr>
            <th>啟用碼</th>
            <th>方案</th>
            <th>是否已啟用</th>
            <th>伺服器名稱</th>
            <th>邀請連結</th>
            <th>創建者</th>
            <th>到期日期</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(codes).map(([key, data]) => {
            console.log('Rendering code:', key, 'Code:', data.code, 'Used:', data.used);
            return (
              <tr key={key}>
                <td>{data.code}</td>
                <td>{data.plan.replace('_', ' ')}</td>
                <td>{data.used ? '是' : '否'}</td>
                <td>{data.serverName || '無'}</td>
                <td>
                  {data.inviteLink ? (
                    <a href={data.inviteLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      連結
                    </a>
                  ) : '無'}
                </td>
                <td>{data.createdBy}</td>
                <td>{new Date(data.expiryDate).toLocaleDateString('zh-TW')}</td>
                <td>
                  <button
                    onClick={() => revokeCode(data.code)}
                    className="btn-revoke"
                    disabled={!data.used}
                  >
                    撤銷
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default App;
