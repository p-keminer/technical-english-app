import React from 'react';

export function SQLiteProvider({
  children,
}: {
  children: React.ReactNode;
  databaseName?: string;
  onInit?: unknown;
}) {
  return <>{children}</>;
}

export function useSQLiteContext() {
  throw new Error('expo-sqlite is not available in the web preview. Use the web learning provider instead.');
}
