import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation, Link } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
}

const routeNames: Record<string, string> = {
  "cocimientos": "Resumen",
  "comparacion": "Comparación",
  "maquinaria": "Maquinaria",
  "ciclos": "Ciclos & Gantt"
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Generar breadcrumbs dinámicos
  const breadcrumbs = pathSegments.map((segment, index) => {
    const url = `/${pathSegments.slice(0, index + 1).join("/")}`;
    const isLast = index === pathSegments.length - 1;
    const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

    return (
      <div key={url} className="flex items-center">
        <BreadcrumbItem className="hidden md:block">
          {isLast ? (
            <BreadcrumbPage>{name}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link to={url}>{name}</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
      </div>
    );
  });

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-sm bg-background/80 sticky top-0 z-10 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link to="/">Brew Insights</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                {breadcrumbs}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min mt-4">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}