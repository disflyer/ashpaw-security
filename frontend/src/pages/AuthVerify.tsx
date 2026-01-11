import { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { LockKeyhole, CheckCircle2 } from 'lucide-react';

export default function AuthVerify() {
  const { appId, userId } = useParams();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/auth/verify/${appId}/${userId}`, { code });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.response?.data?.detail || '验证失败');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
          <CheckCircle2 className="text-green-500 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold mb-2">验证成功</h2>
          <p className="text-gray-500 mb-6">正在跳转回原系统...</p>
          <button className="bg-gray-100 text-gray-800 px-6 py-2 rounded-lg font-medium">手动返回</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full text-center">
        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <LockKeyhole className="text-blue-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">身份验证</h1>
        <p className="text-gray-500 mb-8 text-sm">请输入您手机应用上的 6 位验证码</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input 
              type="text" 
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border rounded-lg p-4 text-center text-3xl tracking-[0.5em] font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="000000"
              autoFocus
              required
            />
          </div>
          
          {status === 'error' && (
            <p className="text-red-500 text-sm">{errorMsg}</p>
          )}

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            确认验证
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-2">
          <button className="text-sm text-blue-600 hover:underline">使用企业微信验证</button>
          <button className="text-sm text-gray-400">无法访问手机？联系管理员重置</button>
        </div>
      </div>
    </div>
  );
}
