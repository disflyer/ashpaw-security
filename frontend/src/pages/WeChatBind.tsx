import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { MessageCircle, CheckCircle } from 'lucide-react';

export default function WeChatBind() {
  const { appId, userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleBind = async () => {
    setLoading(true);
    try {
      // Simulate OAuth redirect or API call
      await api.post(`/auth/bind-wechat/${appId}/${userId}`);
      setTimeout(() => {
        setDone(true);
        setLoading(false);
      }, 1500);
    } catch (err) {
      setLoading(false);
      alert('绑定失败');
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
          <CheckCircle className="text-blue-500 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold mb-2">绑定成功</h2>
          <p className="text-gray-500 mb-6">您现在可以使用企业微信接收验证请求了。</p>
          <button 
            onClick={() => navigate(`/admin/app/${appId}`)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full text-center">
        <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="text-green-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">绑定企业微信</h1>
        <p className="text-gray-500 mb-8 text-sm">绑定后，您可以通过企业微信接收实时登录确认，无需输入动态码。</p>

        <div className="bg-gray-50 p-6 rounded-xl mb-8 border border-dashed border-gray-300">
          <p className="text-sm text-gray-600 mb-4 text-left font-bold">绑定须知：</p>
          <ul className="text-left text-xs text-gray-500 space-y-2 list-disc pl-4">
            <li>需使用当前系统绑定的企业微信账号</li>
            <li>建议开启企业微信桌面通知</li>
            <li>每个账号仅能绑定一个微信</li>
          </ul>
        </div>

        <button 
          onClick={handleBind}
          disabled={loading}
          className={`w-full ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white py-4 rounded-lg font-bold transition flex items-center justify-center gap-2`}
        >
          {loading ? '正在跳转企业微信...' : '立即绑定'}
        </button>
        
        <button 
          onClick={() => window.history.back()}
          className="mt-4 text-gray-400 text-sm hover:underline"
        >
          暂不绑定，返回
        </button>
      </div>
    </div>
  );
}
