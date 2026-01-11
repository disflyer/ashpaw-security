import { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { Plus, ShieldCheck, ExternalLink, Settings, X } from 'lucide-react';

interface Application {
  id: number;
  name: string;
  description: string;
  callback_url: string;
  app_id: string;
  app_secret: string;
}

export default function AdminDashboard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentApp, setCurrentApp] = useState<Application | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    const res = await api.get('/apps');
    setApps(res.data);
  };

  const openCreateForm = () => {
    setIsEditing(false);
    setCurrentApp(null);
    setName('');
    setDescription('');
    setCallbackUrl('');
    setShowForm(true);
  };

  const openEditForm = (app: Application) => {
    setIsEditing(true);
    setCurrentApp(app);
    setName(app.name);
    setDescription(app.description || '');
    setCallbackUrl(app.callback_url || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, description, callback_url: callbackUrl };
    
    if (isEditing && currentApp) {
      await api.put(`/apps/${currentApp.app_id}`, payload);
    } else {
      await api.post('/apps', payload);
    }
    
    setShowForm(false);
    fetchApps();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <ShieldCheck className="text-blue-600" /> 2FA 应用管理
        </h1>
        <button 
          onClick={openCreateForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} /> 新增系统
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{isEditing ? '编辑系统' : '新增系统'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">系统名称</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如：工厂管理系统"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">系统描述</label>
                  <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="简要说明系统用途"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">回调地址 (Callback URL)</label>
                  <input 
                    type="url" 
                    value={callbackUrl} 
                    onChange={(e) => setCallbackUrl(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://your-system.com/auth/callback"
                  />
                  <p className="text-xs text-gray-500 mt-1">验证成功后将携带 token 跳转至此地址</p>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">取消</button>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">保存</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map(app => (
          <div key={app.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition relative group">
             <button 
                onClick={() => openEditForm(app)}
                className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 p-1 opacity-0 group-hover:opacity-100 transition"
                title="设置"
              >
                <Settings size={20} />
              </button>

            <h2 className="text-xl font-semibold mb-2 pr-8">{app.name}</h2>
            <p className="text-gray-600 text-sm mb-4 h-10 overflow-hidden text-ellipsis">{app.description}</p>
            
            <div className="bg-gray-50 p-3 rounded-lg mb-4 space-y-2">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">App ID</p>
                <p className="text-xs font-mono break-all text-gray-700">{app.app_id}</p>
              </div>
              {app.callback_url && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Callback</p>
                  <p className="text-xs font-mono truncate text-gray-700" title={app.callback_url}>{app.callback_url}</p>
                </div>
              )}
            </div>

            <Link 
              to={`/admin/app/${app.app_id}`}
              className="w-full inline-flex justify-center items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              管理账号 <ExternalLink size={16} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}