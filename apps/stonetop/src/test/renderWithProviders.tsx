import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '@/ui/Toast/Toast';
import { render } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';

export const renderRoute = (element: React.ReactElement, path: string, route: string): RenderResult =>
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={route} element={element} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );

export const renderWithProviders = (element: React.ReactElement): RenderResult =>
  render(
    <ToastProvider>
      <MemoryRouter>{element}</MemoryRouter>
    </ToastProvider>,
  );
