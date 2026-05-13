import { UserRole } from "@/types/roles";

export function isAdmin(role?: UserRole) {
  return role === "admin";
}

export function isPartner(role?: UserRole) {
  return role === "partner";
}

export function isBasicUser(role?: UserRole) {
  return role === "basicUser";
}

export function canUpload(role?: UserRole) {
  return role === "admin" || role === "partner";
}

export function canApprove(role?: UserRole) {
  return role === "admin";
}