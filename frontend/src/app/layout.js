import "./globals.css";
import ClientLayout from "./ClientLayout";

export const metadata = {
  title: "Câblage MES - Gestion de Production",
  description: "Système d'Exécution de la Fabrication de Câblage",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full bg-slate-950 text-slate-100 antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
