import type { ReactNode } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { AdminOutletContext } from '../pages/admin/AdminLayout';

export function useAdminSidebarOpen(): boolean {
  const ctx = useOutletContext<AdminOutletContext>();
  return ctx.sidebarOpen;
}

/** Same shell as Products / Orders — always full width of the main panel. */
export function adminPageShellClass() {
  return 'space-y-6 w-full min-w-0';
}

export function bannerEditorGridClass(sidebarOpen: boolean) {
  return sidebarOpen
    ? 'grid w-full grid-cols-1 lg:grid-cols-2 gap-8'
    : 'grid w-full grid-cols-1 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8 xl:gap-10';
}

export function categoryGridClass(sidebarOpen: boolean) {
  return sidebarOpen
    ? 'grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
    : 'grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4';
}

export function teamGridClass(sidebarOpen: boolean) {
  return sidebarOpen
    ? 'grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
    : 'grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4';
}

export function valuesGridClass(sidebarOpen: boolean) {
  return sidebarOpen
    ? 'grid w-full sm:grid-cols-2 gap-4'
    : 'grid w-full sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4';
}

export function contactSocialGridClass(sidebarOpen: boolean) {
  return sidebarOpen
    ? 'grid w-full sm:grid-cols-2 lg:grid-cols-3 gap-4'
    : 'grid w-full sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4';
}

export function settingsFormGridClass(sidebarOpen: boolean) {
  return sidebarOpen
    ? 'grid w-full grid-cols-1 md:grid-cols-2 gap-5'
    : 'grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5';
}

type AdminPageProps = {
  children: ReactNode;
  className?: string;
};

export function AdminPage({ children, className = '' }: AdminPageProps) {
  return <div className={`${adminPageShellClass()} ${className}`.trim()}>{children}</div>;
}
