import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import Typography from "@/components/custom/Typography";

export default function SidebarHeader() {
  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <Link to="/">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                <img
                  src={logo}
                  alt="E2E Manager"
                  className="size-full rounded-lg object-cover"
                />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <Typography
                  type="h1"
                  className="text-base font-bold bg-clip-text"
                >
                  E2E Manager
                </Typography>
                <Typography
                  type="small"
                  className="text-[10px] text-muted-foreground font-mono"
                >
                  STEP-BY-STEP RUNNER
                </Typography>
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
