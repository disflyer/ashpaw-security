import { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { Plus, ShieldCheck, ExternalLink } from 'lucide-react';

interface Application {
  id: number;
  name: string;
  description: string;
  app_id: string;
  app_secret: string;
}

export default function AdminDashboard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    const res = await api.get('/apps');
    setApps(res.data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/apps', { name, description });
    setName('');
    setDescription('');
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
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} /> 新增系统
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">系统名称</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                placeholder="例如：工厂管理系统"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">系统描述</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                placeholder="简要说明系统用途"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">取消</button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">保存</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map(app => (
          <div key={app.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">{app.name}</h2>
            <p className="text-gray-600 text-sm mb-4 h-10 overflow-hidden">{app.description}</p>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">App ID</p>
              <p className="text-sm font-mono break-all">{app.app_id}</p>
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
