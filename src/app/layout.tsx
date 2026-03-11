import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthContext";
import { SidebarProvider } from "@/components/SidebarContext";
import { ProjectProvider } from "@/components/ProjectContext";
import ClientLayout from "@/components/ClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Radar Contractual - Executive Early Warning System",
  description: "Advanced monitoring and risk analysis for high-stakes contractual governance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <ProjectProvider>
              <SidebarProvider>
                <ClientLayout>
                  {children}
                </ClientLayout>
              </SidebarProvider>
            </ProjectProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
