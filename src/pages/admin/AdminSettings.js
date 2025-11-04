import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const AdminSettings = () => {
  const [general, setGeneral] = useState({
    appName: 'HMR Dashboard',
    companyName: 'Blocks',
    supportEmail: 'support@example.com',
    timezone: 'UTC',
  });

  const [theme, setTheme] = useState({
    defaultTheme: 'dark',
    density: 'compact',
    accent: '#00a6ff',
  });

  const [security, setSecurity] = useState({
    require2fa: false,
    sessionMinutes: 60,
    allowRegistration: false,
  });

  const handleSave = () => {
    // Persist settings via API in the future
    // For now, just provide feedback via console
    console.log('Saving settings', { general, theme, security });
    alert('Settings saved (demo)');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-card-foreground">Admin Settings</h2>
        <p className="text-muted-foreground">These settings apply to the entire admin application. They are not tied to specific users or properties.</p>
      </div>

      <Card className="p-6">
        <Card.Title>General</Card.Title>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">App Name</label>
            <input
              className="w-full px-3 py-2 border border-input rounded-lg"
              value={general.appName}
              onChange={(e) => setGeneral({ ...general, appName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Company Name</label>
            <input
              className="w-full px-3 py-2 border border-input rounded-lg"
              value={general.companyName}
              onChange={(e) => setGeneral({ ...general, companyName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Support Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-input rounded-lg"
              value={general.supportEmail}
              onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Timezone</label>
            <select
              className="w-full px-3 py-2 border border-input rounded-lg"
              value={general.timezone}
              onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
            >
              <option value="UTC">UTC</option>
              <option value="Asia/Karachi">Asia/Karachi</option>
              <option value="America/New_York">America/New_York</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <Card.Title>Theme & UI</Card.Title>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Default Theme</label>
            <select
              className="w-full px-3 py-2 border border-input rounded-lg"
              value={theme.defaultTheme}
              onChange={(e) => setTheme({ ...theme, defaultTheme: e.target.value })}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Density</label>
            <select
              className="w-full px-3 py-2 border border-input rounded-lg"
              value={theme.density}
              onChange={(e) => setTheme({ ...theme, density: e.target.value })}
            >
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Accent Color</label>
            <input
              type="color"
              className="w-full h-10 px-1 py-1 border border-input rounded-lg"
              value={theme.accent}
              onChange={(e) => setTheme({ ...theme, accent: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <Card.Title>Auth & Security</Card.Title>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Require 2FA</label>
            <select
              className="w-full px-3 py-2 border border-input rounded-lg"
              value={security.require2fa ? 'yes' : 'no'}
              onChange={(e) => setSecurity({ ...security, require2fa: e.target.value === 'yes' })}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Session Timeout (minutes)</label>
            <input
              type="number"
              min="15"
              className="w-full px-3 py-2 border border-input rounded-lg"
              value={security.sessionMinutes}
              onChange={(e) => setSecurity({ ...security, sessionMinutes: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Public Registration</label>
            <select
              className="w-full px-3 py-2 border border-input rounded-lg"
              value={security.allowRegistration ? 'on' : 'off'}
              onChange={(e) => setSecurity({ ...security, allowRegistration: e.target.value === 'on' })}
            >
              <option value="off">Off</option>
              <option value="on">On (invite not required)</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => window.location.reload()}>Reset</Button>
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
};

export default AdminSettings;


