import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppShell } from "./app/AppShell.tsx";
import { MapView }      from "./app/views/MapView.tsx";
import { HeatmapView }  from "./app/views/HeatmapView.tsx";
import { HubsView }     from "./app/views/HubsView.tsx";
import { PartnersView } from "./app/components/partners/PartnersView.tsx";
import { ReportsScreen } from "./app/components/reports/ReportsScreen.tsx";
import { ReportRequestsView } from "./features/report-requests/ReportRequestsView.tsx";
import { DispatchView } from "./app/components/dispatch/DispatchView.tsx";
import { UsersView } from "./app/components/users/UsersView.tsx";
import "./styles/index.css";
import "leaflet/dist/leaflet.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true,         element: <MapView /> },
      { path: "heatmap",     element: <HeatmapView /> },
      { path: "hubs",        element: <HubsView /> },
      { path: "partners",    element: <PartnersView /> },
      { path: "reports",          element: <ReportsScreen /> },
      { path: "report-requests",  element: <ReportRequestsView /> },
      { path: "dispatch",         element: <DispatchView /> },
      { path: "users",            element: <UsersView /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
    <Toaster position="bottom-right" richColors />
  </QueryClientProvider>
);
