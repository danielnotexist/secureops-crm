# SecureOps CRM — /manage

## 🚀 הוראות פריסה

### שלב 1: Supabase
1. פתח את [Supabase Dashboard](https://supabase.com)
2. לחץ על **SQL Editor**
3. הדבק את תוכן `supabase_schema.sql` והרץ

### שלב 2: Vercel
1. גש ל-[vercel.com](https://vercel.com) → Import Project
2. חבר את GitHub repo זה
3. Settings:
   - **Framework**: Vite
   - **Root Directory**: `.` (שורש)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. לחץ Deploy

### שלב 3: secureops.co.il/manage
ב-Vercel → Settings → Domains, חבר את הדומיין `secureops.co.il`

הקובץ `vercel.json` מטפל בניתוב `/manage/*` כ-SPA.

---

## 📁 מבנה הפרויקט
```
src/
  pages/
    LoginPage.jsx       ← כניסה + הגדרת סיסמה ראשונה
    DashboardPage.jsx   ← לוח בקרה עם גרפים
    ClientsPage.jsx     ← רשימת לקוחות
    ClientDetailPage.jsx ← פרופיל לקוח מלא
    ProjectsPage.jsx    ← ניהול פרויקטים
    LogPage.jsx         ← יומן שינויים
  components/
    Layout.jsx          ← Sidebar + Header
    ClientModal.jsx     ← טופס הוספה/עריכה
    Toast.jsx           ← התראות
  lib/
    supabase.js         ← חיבור לSupabase
  context/
    AuthContext.jsx     ← ניהול כניסה
```

## 👥 משתמשים מורשים
- `daniel@secureops.co.il`
- `dvir@secureops.co.il`

בהתחברות ראשונה — יוצג מסך הגדרת סיסמה.
