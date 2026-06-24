import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Unified page layout - every view renders inside this.
 * Provides consistent padding, max-width, and scroll behavior.
 */
export const PageLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="page-layout">
      {children || <Outlet />}
    </div>
  );
};
