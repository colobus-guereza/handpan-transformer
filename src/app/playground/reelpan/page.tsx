import ReelPanClient from "./ReelPanClient";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#000000" },
        { media: "(prefers-color-scheme: dark)", color: "#000000" },
    ],
};

export const metadata: Metadata = {
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
    },
};

export default async function ReelPanPage({ params }: { params: Promise<Record<string, never>> }) {
    // Unwrap params to satisfy Next.js 16 requirement
    await params;
    return <ReelPanClient />;
}
