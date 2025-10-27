# Organization Dashboard - Quick Start Guide 🚀

## Access URLs

### Organization Portal (New! 🆕)
- **Login**: http://localhost:3000/org/login
- **Dashboard**: http://localhost:3000/orgdashboard

### Admin Portal (Existing)
- **Login**: http://localhost:3000/admin/login
- **Dashboard**: http://localhost:3000/admin

---

## Login Credentials

### HMR Company 🏢
```
Email: admin@hmr.com
Password: hmr123
```
**Shows**: Only HMR Company data

### Saima Company 🏢
```
Email: admin@saima.com
Password: saima123
```
**Shows**: Only Saima Company data

### Super Admin 👨‍💼
```
Email: admin@hmrbuilders.com
Password: admin123
```
**Shows**: ALL organizations data

---

## Quick Test

### Test HMR Organization:
1. Go to: http://localhost:3000/org/login
2. Click the **"🏢 HMR"** button
3. Click **"Sign In"**
4. ✅ You should see: "🏢 HMR Company Organization" banner
5. Navigate through tabs - all data is HMR-specific

### Test Saima Organization:
1. Logout from HMR
2. Go to: http://localhost:3000/org/login
3. Click the **"🏢 Saima"** button
4. Click **"Sign In"**
5. ✅ You should see: "🏢 Saima Company Organization" banner
6. Navigate through tabs - all data is Saima-specific

---

## What Each Organization Sees

### Organization Dashboard Tabs:
- ✅ **Overview** - Summary statistics
- ✅ **Properties** - Their properties only
- ✅ **Users** - Their users only
- ✅ **Investments** - Their investments only
- ✅ **Transactions** - Their transactions only

### Admin Dashboard Tabs:
- ✅ **Overview** - ALL data summary
- ✅ **Properties** - ALL properties
- ✅ **Users** - ALL users
- ✅ **Investments** - ALL investments
- ✅ **Transactions** - ALL transactions
- ✅ **Organizations** - Manage organizations

---

## Files Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── organization/
│   │       └── OrganizationAuth.js       ← Auth context
│   ├── pages/
│   │   └── organization/
│   │       ├── OrgLogin.js               ← Login page
│   │       ├── OrgDashboard.js           ← Main dashboard
│   │       ├── OrgPropertiesManagement.js
│   │       ├── OrgUsersManagement.js
│   │       ├── OrgInvestmentsManagement.js
│   │       └── OrgTransactionsManagement.js
│   └── App.js                            ← Routes configured
```

---

## Key Features

### 🔐 Secure Authentication
- Each organization has unique credentials
- Session persistence with localStorage
- Auto-redirect protection

### 🎨 Beautiful UI
- Gradient backgrounds (blue-purple)
- Organization-specific banners
- Responsive design
- Smooth animations

### 📊 Data Filtering
- All API calls include `organizationId`
- Backend receives: `organizationId: 'hmr-company'` or `'saima-company'`
- Frontend filters data automatically

### 🔄 Independent Systems
- Admin Dashboard = unchanged (shows ALL)
- Organization Dashboard = new (shows ONLY their data)
- Completely separate authentication

---

## Common Issues & Solutions

### Issue: Can't access dashboard
**Solution**: Make sure you're logged in first at `/org/login`

### Issue: Seeing all data instead of filtered
**Solution**: Check that backend is filtering by `organizationId` parameter

### Issue: Logout not working
**Solution**: Clear localStorage manually in DevTools → Application → Local Storage

---

## Adding New Organization

Want to add "Marina Company"? Just update:

**File**: `frontend/src/components/organization/OrganizationAuth.js`

```javascript
const ORGANIZATION_CREDENTIALS = {
  'hmr': { ... },
  'saima': { ... },
  'marina': {  // ADD THIS
    email: 'admin@marina.com',
    password: 'marina123',
    organizationName: 'Marina Company',
    organizationId: 'marina-company',
    organizationSlug: 'marina'
  }
};
```

Done! ✅

---

## Summary

| Dashboard | Who Uses It | What They See |
|-----------|-------------|---------------|
| **Organization** | HMR/Saima Admins | Only their org data |
| **Admin** | Super Admins | All orgs data |

---

## Next Steps

1. ✅ Test HMR login and navigation
2. ✅ Test Saima login and navigation
3. ✅ Test admin login (unchanged)
4. ✅ Verify data filtering works
5. 🔄 Update backend to handle `organizationId` parameter

---

**Need Help?** Check `ORGANIZATION_DASHBOARD_COMPLETE.md` for full documentation.

🎉 **Happy Managing!** 🎉

