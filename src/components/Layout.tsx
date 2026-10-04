import { Outlet } from "react-router-dom";
import Header from "@/components/Header";

/**
 * Shared page frame.
 *
 * Every page previously repeated the same shell: a `min-h-screen bg-background`
 * wrapper, `<Header />`, and a `container mx-auto px-4 py-8 max-w-2xl` main.
 * Four copies that had already drifted — two used `max-w-2xl`, the scenario and
 * voice-lab play screens used `max-w-2xl` with different padding, and none of
 * them shared the viewport-height handling.
 */
const Layout = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <Header />
    <main className="container mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-8">
      <Outlet />
    </main>
  </div>
);

export default Layout;
