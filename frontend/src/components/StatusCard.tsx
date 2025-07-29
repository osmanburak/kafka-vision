import { ReactNode } from 'react';

interface StatusCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  error?: string;
}

export function StatusCard({ title, icon, children, error }: StatusCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 transition-colors">
      <div className="flex items-center mb-4">
        <div className="mr-3 text-blue-500 dark:text-blue-400">{icon}</div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
      </div>
      {error ? (
        <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>
      ) : (
        <div className="text-gray-600 dark:text-gray-300">{children}</div>
      )}
    </div>
  );
}