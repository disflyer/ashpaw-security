import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function AuthSetup() {
  const { appId, userId } = useParams();
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.post(`/auth/setup/${appId}/${userId}`);
        setQrCode(res.data.qr_code);
        setSecret(res.data.secret);
      } catch (err) {
        setError('无法初始化二次验证，请联系管理员。');
      }
    };
    init();
  }, [appId, userId]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/auth/verify/${appId}/${userId}`, { code });
      alert('验证成功并已开启二次验证！');
      navigate(`/auth/verify/${appId}/${userId}`);
    } catch (err) {
      setError('验证码错误，请重试。');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full text-center">
        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="text-blue-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">设置二次验证</h1>
        <p className="text-gray-500 mb-8 text-sm">请使用 Google Authenticator 或 Microsoft Authenticator 扫描下方二维码</p>

        {qrCode && (
          <div className="mb-8 p-4 bg-gray-50 rounded-xl mx-auto flex flex-col items-center">
            <img src={`data:image/png;base64,${qrCode}`} alt="2FA QR Code" className="w-48 h-48" />
            <p className="mt-4 text-xs font-mono text-gray-400">密钥: {secret}</p>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form onSubmit={handleVerify} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">输入 6 位动态验证码</label>
            <input 
              type="text" 
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border rounded-lg p-3 text-center text-2xl tracking-[0.5em] font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="000000"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            完成绑定并验证 <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
