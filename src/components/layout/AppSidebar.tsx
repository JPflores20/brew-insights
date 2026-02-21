import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import {
    LayoutDashboard,
    GitCompare,
    Cog,
    Timer,
    Beer,
    LogOut,
    ArrowLeft,
    User,
    Lock,
    Wrench,
    Activity
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";

// Menu items
const navItems = [
    {
        title: "Resumen",
        url: "/cocimientos",
        icon: LayoutDashboard,
        isActive: true,
    },
    {
        title: "Comparación",
        url: "/cocimientos/comparacion",
        icon: GitCompare,
    },
    {
        title: "Maquinaria",
        url: "/cocimientos/maquinaria",
        icon: Cog,
    },
    {
        title: "Ciclos & Gantt",
        url: "/cocimientos/ciclos",
        icon: Timer,
    },
    {
        title: "Análisis de Recetas",
        url: "/cocimientos/recetas",
        icon: Beer,
        badge: "Nuevo"
    },
    {
        title: "Mantenimiento",
        url: "/cocimientos/mantenimiento",
        icon: Wrench,
        badge: "Nuevo"
    },
    {
        title: "Calidad del Producto",
        url: "/cocimientos/calidad",
        icon: Activity,
        badge: "Nuevo"
    },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const location = useLocation();
    const { user } = useAuth();
    const { data } = useData();
    const hasData = data && data.length > 0;

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link to="/">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <Beer className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Brew Insights</span>
                                    <span className="truncate text-xs">Cocimientos</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navegación</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Volver al Menú">
                                    <Link to="/">
                                        <ArrowLeft />
                                        <span>Volver al Menú</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {navItems.map((item) => {
                                const isDisabled = item.url !== "/cocimientos" && !hasData;
                                const isActive = location.pathname === item.url;

                                if (isDisabled) {
                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                disabled
                                                className="opacity-50 cursor-not-allowed hover:bg-transparent"
                                            >
                                                <item.icon className="text-muted-foreground" />
                                                <span className="text-muted-foreground">{item.title}</span>
                                                {'badge' in item && (
                                                    <span className="ml-2 rounded-md bg-green-500/20 px-1.5 py-0.5 text-[10px] font-medium text-green-600 leading-none">
                                                        {item.badge}
                                                    </span>
                                                )}
                                                <Lock className="ml-auto size-3 text-muted-foreground/70" />
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                }

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className={cn(isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-[0_0_15px_rgba(234,88,12,0.15)]")}>
                                            <Link to={item.url} className="flex items-center w-full">
                                                <item.icon className={cn(isActive && "text-primary")} />
                                                <span>{item.title}</span>
                                                {'badge' in item && (
                                                    <span className="ml-auto rounded-md bg-green-500/10 border border-green-500/30 px-1.5 py-0.5 text-[10px] font-medium text-green-500 leading-none shadow-sm shadow-green-500/10">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <div className="p-1">
                    <div className="flex items-center gap-2 p-2 rounded-md bg-sidebar-accent/50 mb-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                            <p className="text-sm font-medium truncate">{user?.displayName || "Usuario"}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                variant="outline"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                onClick={handleLogout}
                            >
                                <LogOut />
                                <span>Cerrar Sesión</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
