export const OWNER_EMAIL = 'kelvinchen20000108@gmail.com';
export const ROLES = { GUEST:'guest', FREE:'free', VIP:'vip', AGENT:'agent', ADMIN:'admin', SUPER_ADMIN:'super_admin' };
export const ROLE_LEVEL = { guest:0, free:1, vip:2, agent:3, admin:4, super_admin:5 };
export const isOwner      = (email) => email === OWNER_EMAIL;
export const isSuperAdmin = (role)  => role === ROLES.SUPER_ADMIN;
export const isAdmin      = (role)  => ROLE_LEVEL[role] >= ROLE_LEVEL.admin;
export const isVIP        = (role)  => ROLE_LEVEL[role] >= ROLE_LEVEL.vip;
