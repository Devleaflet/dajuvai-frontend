import { useAuth, UserData } from "../context/AuthContext";
import { ModuleName } from "../api/staff";
import { Navigate } from "react-router-dom";

export type PermissionActionType = "view" | "create_edit" | "delete";

const ACTION_LEVELS: Record<string, number> = {
  view: 1,
  create_edit: 2,
  delete: 3,
};

export function hasPermission(
  user: UserData | null,
  module: ModuleName,
  requiredAction: PermissionActionType = "view"
): boolean {
  if (!user) return false;

  // Admin role has full access to all modules
  if (user.role === "admin") return true;

  // Non-staff users do not have staff module permissions
  if (user.role !== "staff") return false;

  if (!user.permissions) return false;

  // Lookup permission for module (checking exact, lowercase, and plural/singular aliases)
  const normModule = module.toLowerCase();
  const userAction =
    user.permissions[normModule] ||
    user.permissions[module] ||
    user.permissions[normModule.replace(/s$/, "")] ||
    user.permissions[`${normModule}s`];

  if (!userAction) return false;

  const userLevel = ACTION_LEVELS[userAction] || 0;
  const requiredLevel = ACTION_LEVELS[requiredAction] || 1;

  return userLevel >= requiredLevel;
}

/**
 * Custom hook for permission-based access control (PBAC) in React components.
 */
export function usePermission() {
  const { user } = useAuth();

  const can = (
    module: ModuleName,
    action: PermissionActionType = "view"
  ): boolean => {
    return hasPermission(user, module, action);
  };

  return {
    can,
    permissions: user?.permissions || {},
    isStaff: user?.role === "staff",
    isAdmin: user?.role === "admin",
    user,
  };
}


interface PermissionRouteProps{
  module: ModuleName;
  permission: PermissionActionType;
  children: React.ReactNode;
}

export function PermissionRoute({
  module,
  permission,
  children,
}: PermissionRouteProps) {
  const { can } = usePermission();

  if (!can(module, permission)) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return children;
}