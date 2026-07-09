import { Users, Server, Activity, Database, Cpu, HardDrive } from 'lucide-react';

export default function Admin({ user }) {
  // Mock data for the UI
  const mockUsers = [
    { id: 1, name: 'Jane Doe', email: 'demo@immich.app', role: 'Admin', storage: '2.4 GB', lastActive: '2 mins ago' },
    { id: 2, name: 'John Smith', email: 'john@example.com', role: 'User', storage: '850 MB', lastActive: '1 day ago' },
    { id: 3, name: 'Family iPad', email: 'tablet@example.com', role: 'User', storage: '12 GB', lastActive: '5 hours ago' },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 w-full pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Administration</h1>
          <p className="text-white/50">Server metrics and user management control panel.</p>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1.5 rounded-full text-sm font-medium border border-green-500/20">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Server Online
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Metric Card 1 */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Cpu className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-2 text-white/50 mb-4">
            <Cpu className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-wider">CPU Usage</span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-bold text-white">12</span>
            <span className="text-lg text-white/50 mb-1">%</span>
          </div>
          <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-[12%]" />
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Activity className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-2 text-white/50 mb-4">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-wider">Memory (RAM)</span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-bold text-white">4.2</span>
            <span className="text-lg text-white/50 mb-1">GB / 16 GB</span>
          </div>
          <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
            <div className="bg-orange-400 h-full w-[26%]" />
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <HardDrive className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-2 text-white/50 mb-4">
            <HardDrive className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-wider">Storage Array</span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-bold text-white">1.2</span>
            <span className="text-lg text-white/50 mb-1">TB / 4 TB</span>
          </div>
          <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-400 h-full w-[30%]" />
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">User Management</h2>
          </div>
          <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            + Invite User
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-white/40 text-xs uppercase tracking-wider border-b border-white/5">
                <th className="p-4 font-bold">User</th>
                <th className="p-4 font-bold">Role</th>
                <th className="p-4 font-bold">Storage Used</th>
                <th className="p-4 font-bold">Last Active</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockUsers.map(u => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-black font-bold text-sm">
                        {u.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-white">{u.name}</p>
                        <p className="text-xs text-white/50">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${u.role === 'Admin' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/60'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-white/80 text-sm">{u.storage}</td>
                  <td className="p-4 text-white/50 text-sm">{u.lastActive}</td>
                  <td className="p-4 text-right">
                    <button className="text-blue-400 hover:text-blue-300 text-sm font-medium mr-4 transition-colors">Edit</button>
                    <button className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">Suspend</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
