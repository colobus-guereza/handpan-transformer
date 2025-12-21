import ReelPanPage from "./PracticeClient";

export default async function Page({ params }: { params: Promise<{}> }) {
    await params;
    return <ReelPanPage />;
}
