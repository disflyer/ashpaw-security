import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { ChevronLeft, RotateCcw, Shield, MessageCircle } from 'lucide-react';

interface UserAuth {
  id: number;
  user_id: string;
  is_totp_enabled: boolean;
  is_wechat_enabled: boolean;
  wechat_id?: string;
}

export default function AppDetails() {
  const { appId } = useParams();
  const [users, setUsers] = useState<UserAuth[]>([]);

  useEffect(() => {
    fetchUsers();
  }, [appId]);

  const fetchUsers = async () => {
    const res = await api.get(`/apps/${appId}/users`);
    setUsers(res.data);
  };

  const handleReset = async (userId: string) => {
    if (confirm(`确定要重置用户 ${userId} 的二次验证状态吗？`)) {
      await api.delete(`/apps/${appId}/users/${userId}`);
      fetchUsers();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link to="/admin" className="inline-flex items-center gap-1 text-blue-600 mb-6 hover:underline">
        <ChevronLeft size={20} /> 返回列表
      </Link>
      
      <h1 className="text-3xl font-bold text-gray-800 mb-8">账号集成情况</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-bottom border-gray-200">
              <th className="p-4 font-semibold text-gray-700">用户 ID (业务系统)</th>
              <th className="p-4 font-semibold text-gray-700">TOTP 状态</th>
              <th className="p-4 font-semibold text-gray-700">企业微信状态</th>
              <th className="p-4 font-semibold text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">暂无用户数据</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="border-t border-gray-100">
                  <td className="p-4 font-medium">{user.user_id}</td>
                  <td className="p-4">
                    {user.is_totp_enabled ? (
                      <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold">
                        <Shield size={14} /> 已开启
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">未开启</span>
                    )}
                  </td>
                  <td className="p-4">
                    {user.is_wechat_enabled ? (
                      <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-bold">
                        <MessageCircle size={14} /> 已绑定 ({user.wechat_id})
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">未绑定</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleReset(user.user_id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition flex items-center gap-1 text-sm"
                    >
                      <RotateCcw size={16} /> 重置验证
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
