import ReelPanClient from "./ReelPanClient";

export default async function ReelPanPage({ params }: { params: Promise<Record<string, never>> }) {
    // Unwrap params to satisfy Next.js 16 requirement
    await params;
    return <ReelPanClient />;
}
