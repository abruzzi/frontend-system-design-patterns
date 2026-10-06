import { Header } from "./components/Header";
import { NdjsonStreamDemo } from "./components/NdjsonStreamDemo";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(56,189,248,0.12),transparent)]">
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 md:px-6">
        <Header />
        <NdjsonStreamDemo />
      </div>
    </div>
  );
}
