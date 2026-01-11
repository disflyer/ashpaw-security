import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AuthSetup() {
  const { appId, userId } = useParams();
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  
  // Success & Redirect State
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

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

  useEffect(() => {
    let timer: any;
    if (isSuccess && redirectUrl && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (isSuccess && redirectUrl && countdown === 0) {
      window.location.href = redirectUrl;
    }
    return () => clearTimeout(timer);
  }, [isSuccess, redirectUrl, countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post(`/auth/verify/${appId}/${userId}`, { code });
      setRedirectUrl(res.data.redirect_url);
      setIsSuccess(true);
    } catch (err) {
      setError('验证码错误，请重试。');
    }
  };

  if (isSuccess) {
     return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
          <CheckCircle2 className="text-green-500 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold mb-2">绑定成功</h2>
          
          {redirectUrl ? (
            <div>
              <p className="text-gray-500 mb-6">正在跳转回原系统 ({countdown}s)...</p>
              <a 
                href={redirectUrl}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                立即跳转 <ArrowRight size={16} />
              </a>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 mb-6">您已成功绑定 2FA。</p>
              <button className="bg-gray-100 text-gray-800 px-6 py-2 rounded-lg font-medium">关闭</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full text-center">
        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="text-blue-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">设置二次验证</h1>
        <p className="text-gray-500 mb-8 text-sm">请使用 Google Authenticator 或 Microsoft Authenticator 扫描下方二维码</p>

        {qrCode && (
          <div className="mb-8 p-4 bg-gray-50 rounded-xl inline-block">
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