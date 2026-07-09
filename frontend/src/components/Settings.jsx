import { User, Palette, Shield, Download, HardDrive } from 'lucide-react';

export default function Settings({ user }) {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 w-full pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-white mb-2">Account Settings</h1>
        <p className="text-white/50">Manage your personal preferences, security, and data.</p>
      </div>

      <div className="space-y-6">
        
        {/* Profile Card */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Profile</h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-24 h-24 shrink-0 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-black font-bold text-4xl shadow-lg">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            
            <div className="flex-1 space-y-4 w-full">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-1">Display Name</label>
                <input 
                  type="text" 
                  defaultValue={user?.email?.split('@')[0] || 'User'}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-1">Email Address</label>
                <input 
                  type="email" 
                  defaultValue={user?.email || 'demo@immich.app'}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  disabled
                />
                <p className="text-xs text-white/30 mt-1">Contact your administrator to change your email address.</p>
              </div>
              
              <button className="bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-2 rounded-xl transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Preferences Card */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Preferences</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Theme</p>
                <p className="text-sm text-white/50">Choose how KinVault looks to you.</p>
              </div>
              <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
                <button className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-sm font-medium">Dark</button>
                <button className="px-4 py-1.5 rounded-lg text-white/40 hover:text-white transition-colors text-sm font-medium">Light</button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Default Landing Page</p>
                <p className="text-sm text-white/50">What to show when you log in.</p>
              </div>
              <select className="bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-primary">
                <option>Photos Timeline</option>
                <option>Explore</option>
                <option>Albums</option>
              </select>
            </div>
          </div>
        </div>

        {/* Storage Card */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <HardDrive className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Storage Quota</h2>
          </div>
          
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold text-white">2.4 GB <span className="text-sm font-normal text-white/50">/ 10 GB</span></span>
              <span className="text-sm text-primary font-medium">24% Used</span>
            </div>
            
            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden flex">
              <div className="bg-blue-400 h-full w-[15%]" title="Photos" />
              <div className="bg-purple-500 h-full w-[9%]" title="Videos" />
            </div>
            
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <span className="text-xs text-white/60">Photos (1.5 GB)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-xs text-white/60">Videos (0.9 GB)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-black/40 border border-white/10" />
                <span className="text-xs text-white/60">Free (7.6 GB)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Data */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Security & Data</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
              <div>
                <p className="font-medium text-white mb-1">Change Password</p>
                <p className="text-sm text-white/50">Ensure your account uses a strong password.</p>
              </div>
              <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                Update
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
              <div>
                <p className="font-medium text-white mb-1">Download Archive</p>
                <p className="text-sm text-white/50">Request a .zip file containing all your photos and videos.</p>
              </div>
              <button className="bg-white hover:bg-white/90 text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                <Download className="w-4 h-4" /> Export Data
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
