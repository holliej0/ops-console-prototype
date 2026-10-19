import type { Metadata } from "next";
import "../design-system/styles/base.css";
import "../design-system/components/components.css";
import "./console.css";

export const metadata: Metadata = {
  title: "Relay Ops: shipment exceptions prototype",
  description: "An interactive prototype of an operations console for triaging medical supply shipment exceptions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
