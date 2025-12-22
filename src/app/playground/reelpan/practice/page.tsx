import ReelPanPage from "./PracticeClient";

export default async function Page({ params }: { params: Promise<Record<string, never>> }) {
    // Unwrap params to satisfy Next.js 16 requirement
    await params;
    return <ReelPanPage />;
}
