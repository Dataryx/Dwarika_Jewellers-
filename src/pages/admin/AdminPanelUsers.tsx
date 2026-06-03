import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import AdminUsersList from '../../components/admin/dashboard/AdminUsersList';
import { AdminPage } from '../../lib/adminPageLayout';

export default function AdminPanelUsers() {
  return (
    <AdminPage>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Users</h1>
            <p className="text-sm text-gray-500 mt-1">Accounts with access to this admin panel</p>
          </div>
        </div>
      </motion.div>

      <AdminUsersList />
    </AdminPage>
  );
}
